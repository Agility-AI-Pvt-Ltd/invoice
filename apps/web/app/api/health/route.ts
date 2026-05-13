import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { Redis } from '@upstash/redis';

export async function GET() {
  const status: Record<string, any> = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      database: 'DOWN',
      redis: 'DOWN',
    },
  };

  try {
    // Check Database
    await prisma.$queryRaw`SELECT 1`;
    status.services.database = 'UP';
  } catch (error) {
    status.status = 'DEGRADED';
    status.services.database = 'DOWN';
  }

  try {
    // Check Redis (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = Redis.fromEnv();
      await redis.ping();
      status.services.redis = 'UP';
    } else {
      status.services.redis = 'SKIPPED (Not Configured)';
    }
  } catch (error) {
    status.status = 'DEGRADED';
    status.services.redis = 'DOWN';
  }

  const statusCode = status.status === 'UP' ? 200 : 503;
  return NextResponse.json(status, { status: statusCode });
}
