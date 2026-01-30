import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json(
    { error: { code, message, status } },
    { status }
  );
}

export const Errors = {
  UNAUTHORIZED: (msg = "Unauthorized") => createErrorResponse(401, "UNAUTHORIZED", msg),
  NOT_FOUND: (resource = "Resource") => createErrorResponse(404, "NOT_FOUND", `${resource} not found`),
  BAD_REQUEST: (msg: string) => createErrorResponse(400, "BAD_REQUEST", msg),
  INTERNAL: (msg = "Internal server error") => createErrorResponse(500, "INTERNAL_ERROR", msg),
};
