import { apiLogout, getToken } from "./api";

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getCurrentUser(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || payload.sub || "Teacher";
  } catch {
    return null;
  }
}

export function logout(): void {
  apiLogout();
}