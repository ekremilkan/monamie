import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!users.length) {
      console.log('No users found. You can register via POST /api/auth/register.');
      return;
    }

    console.log('Users:');
    for (const u of users) {
      console.log(
        `- id=${u.id} email=${u.email} name=${u.name ?? '-'} provider=${u.provider ?? 'local'} verified=${u.emailVerified ? 'yes' : 'no'} createdAt=${u.createdAt.toISOString()} lastLoginAt=${u.lastLoginAt ? u.lastLoginAt.toISOString() : '-'}`
      );
    }
  } catch (err) {
    console.error('Failed to list users:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();