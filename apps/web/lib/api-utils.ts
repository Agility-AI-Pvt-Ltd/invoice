import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import type { User, Organization } from '@repo/db';
import { AppError, ApiErrors, handleApiError } from './errors';
import { logger } from './logger';

/**
 * Extended User type to include owned organizations.
 */
export type UserWithOrgs = User & {
  ownedOrgs?: Organization[];
};

/**
 * Helper to verify organization access for a given user.
 */
export function verifyOrgAccess(
  user: UserWithOrgs | null | undefined,
  organizationId: string | undefined
): { hasAccess: true; org: Organization } | { hasAccess: false; error: AppError } {
  if (!user) {
    return { hasAccess: false, error: ApiErrors.UNAUTHORIZED() };
  }

  if (!organizationId) {
    return { hasAccess: false, error: ApiErrors.BAD_REQUEST('Organization ID required') };
  }

  const org = user.ownedOrgs?.find((o) => o.id === organizationId);
  if (!org) {
    return { hasAccess: false, error: ApiErrors.FORBIDDEN() };
  }

  return { hasAccess: true, org };
}

/**
 * Standardized API response structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

/**
 * Creates a standardized success response.
 */
export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Creates a standardized error response (for non-NextResponse use cases).
 */
export function errorResponse(error: string, code: string = 'BAD_REQUEST'): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message: error,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper to check if user owns an organization.
 */
export async function requireOrgOwnership(
  user: UserWithOrgs | null | undefined,
  organizationId: string
): Promise<{ valid: true; org: Organization } | { valid: false; error: AppError }> {
  const result = verifyOrgAccess(user, organizationId);
  if (!result.hasAccess) {
    return { valid: false, error: result.error };
  }
  return { valid: true, org: result.org };
}

/**
 * Logs an API action to the audit trail.
 * Note: Should ideally be called within a transaction for atomicity.
 */
export async function logApiAction(
  tx: any, // Accepts Prisma transaction or client
  organizationId: string,
  entity: string,
  entityId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  try {
    await tx.activityLog.create({
      data: {
        organizationId,
        entity,
        entityId,
        action,
        meta: meta || {},
      },
    });
  } catch (err) {
    logger.warn('audit-log', `Failed to create activity log for ${entity}:${entityId}`, err, { organizationId, action });
    // In some cases we don't want to block, but logging is now structured
  }
}

// Deprecated in favor of lib/errors.ts:handleApiError
export const createErrorResponse = handleApiError;
