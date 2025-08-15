import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

export function registerMessageHandlers(io: Server, socket: Socket) {
  socket.on('message.send', async (payload: any, ack?: Function) => {
    const { groupId, message, messageType = 'TEXT', attachments } = payload;
    const userId = socket.data.user.id;

    // Check if user is a member of the group
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      if (typeof ack === 'function') {
        ack({
          success: false,
          message: 'You are not a member of this group',
        });
      }
      return;
    }

    // Create the message
    const newMessage = await prisma.chatGroupMessage.create({
      data: {
        groupId,
        senderId: userId,
        message,
        messageType,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Update group's updatedAt timestamp
    await prisma.chatGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    // Broadcast the message to others
    socket.to(`group:${groupId}`).emit('message.new', newMessage);

    if (typeof ack === 'function') {
      ack({ success: true, message: 'Message delivered' });
    }
  });

  socket.on(
    'message.read',
    async (payload: { messageId: string }, ack?: Function) => {
      try {
        const { messageId } = payload;
        const userId = socket.data.user.id;

        // Check if message exists and user is a member of the group
        const message = await prisma.chatGroupMessage.findUnique({
          where: { id: messageId },
          include: {
            group: {
              include: {
                members: {
                  where: {
                    userId,
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        });

        if (!message || message.group.members.length === 0) {
          if (typeof ack === 'function') {
            ack({
              success: false,
              message:
                'Message not found or you are not a member of this group',
            });
          }
          return;
        }

        // Create or update read receipt
        await prisma.chatMessageRead.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId,
            },
          },
          create: {
            messageId,
            userId,
          },
          update: {
            readAt: new Date(),
          },
        });

        // Broadcast read acknowledgement
        socket.to(`group:${message.groupId}`).emit('message.read-ack', {
          messageId,
          userId,
          readAt: new Date(),
          isFor: message.senderId
        });
      } catch (err) {
        console.error(
          '[SOCKET ERROR] An error occurred while marking message as read\n',
          err
        );
        if (typeof ack === 'function') {
          ack({
            success: false,
            message: 'An error occurred while marking message as read',
          });
        }
      }
    }
  );
}
