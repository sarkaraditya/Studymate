#!/usr/bin/env node
/**
 * reset-password.mjs
 * 
 * Quickly reset or set a password for any user account in the database.
 * 
 * Usage:
 *   node scripts/reset-password.mjs <email> <newPassword>
 * Example:
 *   node scripts/reset-password.mjs adityasarkar1975@gmail.com mynewpassword123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.mjs <email> <newPassword>');
  console.log('Example: node scripts/reset-password.mjs adityasarkar1975@gmail.com 123456');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    console.log(`✓ Password successfully updated for ${email}!`);
    console.log(`You can now sign in with this password from any device.`);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
