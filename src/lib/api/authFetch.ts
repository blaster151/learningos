import type { User } from "firebase/auth";

export async function authFetch(
  user: User,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
