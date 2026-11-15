import type { LoginInput, LoginResult, RegisterInput, UserProfile } from '../types/auth'
import { envelopeData, request } from '../utils/request'

export async function registerStudent(input: RegisterInput): Promise<UserProfile> {
  const response = await request.post('/auth/register', input, { skipAuth: true })
  return envelopeData(response)
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await request.post('/auth/login', input, { skipAuth: true })
  return envelopeData(response)
}

export async function logout(): Promise<void> {
  await request.post('/auth/logout')
}
