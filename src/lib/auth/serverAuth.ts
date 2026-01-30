import { NextRequest, NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export async function getAuthUser(request: NextRequest): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return null;

  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    return null;
  }
}

export async function requireAuthUser(request: NextRequest): Promise<DecodedIdToken> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export function assertSameUser(requestedUserId: string | null | undefined, authedUserId: string) {
  if (!requestedUserId) return;
  if (requestedUserId !== authedUserId) {
    throw new AuthError("Forbidden", 403);
  }
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
