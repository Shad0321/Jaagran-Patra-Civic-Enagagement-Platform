// This script is used to seed the database with initial data.
// It can be run using the command: `node scripts/seed.js`


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Add Uttarakhand state from states.json
  //   await prisma.state.upsert({
  //     where: { id: 'cmd4ta9ix0002geeo4f8vf8zv' },
  //     update: {},
  //     create: {
  //       id: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       name: 'Uttarakhand',
  //       code: 'UK',
  //       createdAt: new Date('2025-07-15T17:33:52.853Z'),
  //       updatedAt: new Date('2025-07-15T17:33:52.853Z'),
  //       latitude: 30.0668,
  //       longitude: 79.0193,
  //     },
  //   });
  //   console.log('Inserted state: Uttarakhand');
  // Add Uttarakhand district from districts.json
  //   await prisma.district.upsert({
  //     where: { id: 'cmd4taa730004geeoqsez710u' },
  //     update: {},
  //     create: {
  //       id: 'cmd4taa730004geeoqsez710u',
  //       name: 'Uttarakhand',
  //       code: 'UK',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       createdAt: new Date('2025-07-15T17:33:53.822Z'),
  //       updatedAt: new Date('2025-07-15T17:33:53.822Z'),
  //       latitude: 30.0668,
  //       longitude: 79.0193,
  //     },
  //   });
  //   console.log('Inserted district: Uttarakhand');
  // Add constituencies for Uttarakhand
  //   const constituencies = [
  //     {
  //       id: 'cmd4taatx0006geeoxpyk5vz4',
  //       name: 'Tehri Garhwal',
  //       code: 'TEHRI_GARHWAL',
  //       type: 'GENERAL',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       districtId: 'cmd4taa730004geeoqsez710u',
  //       createdAt: new Date('2025-07-15T17:33:54.645Z'),
  //       updatedAt: new Date('2025-07-15T19:37:39.500Z'),
  //       latitude: 30.3783,
  //       longitude: 78.4805,
  //     },
  //     {
  //       id: 'cmd4taazt0008geeoyroiklb0',
  //       name: 'Garhwal',
  //       code: 'GARHWAL',
  //       type: 'GENERAL',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       districtId: 'cmd4taa730004geeoqsez710u',
  //       createdAt: new Date('2025-07-15T17:33:54.858Z'),
  //       updatedAt: new Date('2025-07-15T19:37:40.227Z'),
  //       latitude: 30.0668,
  //       longitude: 79.0193,
  //     },
  //     {
  //       id: 'cmd4tab2p000ageeo6l5fqqkp',
  //       name: 'Almora (SC)',
  //       code: 'ALMORA_(SC)',
  //       type: 'SC',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       districtId: 'cmd4taa730004geeoqsez710u',
  //       createdAt: new Date('2025-07-15T17:33:54.962Z'),
  //       updatedAt: new Date('2025-07-15T19:37:40.443Z'),
  //       latitude: 29.5971,
  //       longitude: 79.659,
  //     },
  //     {
  //       id: 'cmd4tab5k000cgeeoguer2758',
  //       name: 'Nainital-Udhamsingh Nagar',
  //       code: 'NAINITAL-UDHAMSINGH_NAGAR',
  //       type: 'GENERAL',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       districtId: 'cmd4taa730004geeoqsez710u',
  //       createdAt: new Date('2025-07-15T17:33:55.064Z'),
  //       updatedAt: new Date('2025-07-15T19:37:40.648Z'),
  //       latitude: 29.3803,
  //       longitude: 79.4636,
  //     },
  //     {
  //       id: 'cmd4tab8g000egeeoenq2be1p',
  //       name: 'Haridwar',
  //       code: 'HARIDWAR',
  //       type: 'GENERAL',
  //       stateId: 'cmd4ta9ix0002geeo4f8vf8zv',
  //       districtId: 'cmd4taa730004geeoqsez710u',
  //       createdAt: new Date('2025-07-15T17:33:55.169Z'),
  //       updatedAt: new Date('2025-07-15T19:37:40.853Z'),
  //       latitude: 29.9457,
  //       longitude: 78.1642,
  //     },
  //   ];
  //   for (const constituency of constituencies) {
  //     await prisma.constituency.upsert({
  //       where: { id: constituency.id },
  //       update: {},
  //       create: constituency,
  //     });
  //     console.log(`Inserted constituency: ${constituency.name}`);
  //   }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
