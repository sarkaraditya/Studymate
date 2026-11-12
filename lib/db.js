import { PrismaClient } from '@prisma/client';

function sanitizeUrl(raw) {
  if (!raw) return raw;
  let u = String(raw).trim();
  // Strip variable name if pasted as KEY=VALUE
  if (u.includes('=')) {
    const parts = u.split('=');
    if (parts[0].trim().toUpperCase().includes('DATABASE_URL')) {
      u = parts.slice(1).join('=').trim();
    }
  }
  // Strip wrapping double or single quotes
  while (
    (u.startsWith('"') && u.endsWith('"')) ||
    (u.startsWith("'") && u.endsWith("'"))
  ) {
    u = u.slice(1, -1).trim();
  }
  return u;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = sanitizeUrl(process.env.DATABASE_URL);
}
if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL_UNPOOLED = sanitizeUrl(process.env.DATABASE_URL_UNPOOLED);
} else if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
}

const cleanedUrl = process.env.DATABASE_URL;

// Reuse one client across hot reloads in dev so we don't exhaust connections.
const g = globalThis;
export const prisma =
  g.__prisma ??
  new PrismaClient(
    cleanedUrl
      ? {
          datasources: {
            db: {
              url: cleanedUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') g.__prisma = prisma;
