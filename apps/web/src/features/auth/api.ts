import { apiRequest } from "../../api/http";

export interface Administrator {
  id: string;
  email: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export interface SessionResponse {
  user: Administrator | null;
}

export function login(input: LoginInput): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/auth/login", {
    body: JSON.stringify(input),
    method: "POST",
  });
}
