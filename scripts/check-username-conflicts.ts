import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESERVED_USERNAMES = [
  'admin', 'api', 'app', 'auth', 'blog', 'help',
  'login', 'logout', 'map', 'profile', 'register',
  'settings', 'teams', 'share', 'projects', 'locations',
  'verify-email', 'reset-password', 'forgot-password',
  'cancel-email-change', 'verify-email-change', 'sentry-test'
];

async function checkUsernameConflicts() {
  console.log('🔍 Checking for reserved username conflicts...\n');

  const conflicts = await prisma.user.findMany({
    where: {
      username: {
        in: RESERVED_USERNAMES,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true
    }
  });

  if (conflicts.length === 0) {
    console.log('✅ No conflicts found! Safe to proceed with namespaces.\n');
  } else {
    console.log(`⚠️  Found ${conflicts.length} conflict(s):\n`);
    conflicts.forEach(user => {
      console.log(`  - Username: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log(`    ID: ${user.id}\n`);
    });
    console.log('⚠️  These users will need to change their username before implementing namespaces.\n');
  }

  await prisma.$disconnect();
}

checkUsernameConflicts().catch(console.error);
