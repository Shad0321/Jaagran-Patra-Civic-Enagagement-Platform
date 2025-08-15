import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerMessageHandlers } from './ws/chat.service';
import prisma from './config/database';
import { config } from './config/environment';

const io = new Server({
  cors: {
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('Access denied. No token provided.'));
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Invalid token.'));
  }
});

io.on('connection', async (socket) => {
  const user = socket.data.user;

  socket.join(`user:${user.id}`);
  // Join the user to all groups
  const memberGroups = await prisma.chatGroup.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
          status: 'ACTIVE',
        },
      },
      isActive: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: { id: true },
  });

  const joins = memberGroups.map((g) => socket.join(`group:${g.id}`));
  await Promise.all(joins);

  registerMessageHandlers(io, socket);
});

export default io;
