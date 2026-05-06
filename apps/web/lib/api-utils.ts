import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import type { User, Organization } from '@repo/db';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public logDetails?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common error codes
export const ApiErrors = {
  UNAUTHORIZED: () => new ApiError(401, 'Unauthorized'),
  FORBIDDEN: () => new ApiError(403, 'Forbidden'),
  NOT_FOUND: () => new ApiError(404, 'Not found'),
  BAD_REQUEST: (msg: string) => new ApiError(400, msg),
  CONFLICT: (msg: string) => new ApiError(409, msg),
  TOO_MANY_REQUESTS: (retryAfter?: number) =>
    new ApiError(429, `Too many requests${retryAfter ? `. Try again in ${retryAfter}s` : ''}`, {
      retryAfter,
    }),
  INTERNAL_ERROR: () => new ApiError(500, 'Internal server error'),
};

// Helper to verify org access
export function verifyOrgAccess(
  user: any,
  organizationId: string | undefined
): { hasAccess: true; org: Organization } | { hasAccess: false; error: ApiError } {
  if (!user) {
    return { hasAccess: false, error: ApiErrors.UNAUTHORIZED() };
  }

  if (!organizationId) {
    return { hasAccess: false, error: ApiErrors.BAD_REQUEST('Organization ID required') };
  }

  const hasAccess = user.ownedOrgs?.some((org: any) => org.id === organizationId);
  if (!hasAccess) {
    return { hasAccess: false, error: ApiErrors.FORBIDDEN() };
  }

  const org = user.ownedOrgs.find((org: any) => org.id === organizationId);
  return { hasAccess: true, org };
}

// Safe error response handler
export function createErrorResponse(error: unknown, context: string) {
  const actualError = error instanceof Error ? error : new Error(String(error));

  // Log the full error with context
  console.error(`[${context}]`, {
    message: actualError.message,
    stack: actualError.stack,
    timestamp: new Date().toISOString(),
  });

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if ((actualError as any).code === 'P2002') {
    const field = (actualError as any).meta?.target?.[0] || 'field';
    return NextResponse.json(
      { error: `${field} already exists` },
      { status: 409 }
    );
  }

  if ((actualError as any).code === 'P2025') {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  // Generic error - don't expose details
  return NextResponse.json(
    { error: 'An error occurred while processing your request' },
    { status: 500 }
  );
}

// Type-safe response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(error: string): ApiResponse<null> {
  return { success: false, error };
}

// Helper to check if user owns organization
export async function requireOrgOwnership(
  user: any,
  organizationId: string
): Promise<{ valid: true; org: Organization } | { valid: false; error: ApiError }> {
  const org = user?.ownedOrgs?.find((org: any) => org.id === organizationId);
  if (!org) {
    return { valid: false, error: ApiErrors.FORBIDDEN() };
  }
  return { valid: true, org };
}

// Helper to log API action to audit trail
export async function logApiAction(
  organizationId: string,
  entity: string,
  entityId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId,
        entity,
        entityId,
        action,
        meta: (meta as any) || {},
      },
    });
  } catch (err) {
    console.warn('[audit-log] Failed to create activity log:', err);
    // Don't throw - audit logging should never block main operation
  }
}
