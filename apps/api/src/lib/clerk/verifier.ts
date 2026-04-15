import { verifyToken } from '@clerk/backend';
import { env } from '../../config/env';

export interface VerifiedToken {
  userId: string;
  sessionId: string;
}

export class TokenVerificationError extends Error {
  constructor(
    message: string,
    public readonly code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'VERIFICATION_FAILED'
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new TokenVerificationError('Authorization header missing', 'MISSING_TOKEN');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new TokenVerificationError('Invalid authorization header format', 'INVALID_TOKEN');
  }

  return parts[1];
}

export async function verifyJwt(token: string): Promise<VerifiedToken> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!payload.sub) {
      throw new TokenVerificationError('Token missing user ID', 'INVALID_TOKEN');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid || '',
    };
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown verification error';

    if (message.includes('expired')) {
      throw new TokenVerificationError('Token has expired', 'EXPIRED_TOKEN');
    }

    throw new TokenVerificationError(message, 'VERIFICATION_FAILED');
  }
}
