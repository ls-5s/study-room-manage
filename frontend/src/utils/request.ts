import axios, { type AxiosResponse } from 'axios'
import type { ApiResponse, ErrorCode } from '../types/api'
import { clearAuthToken, getAuthToken } from './auth-session'

export type RequestErrorKind =
  'network' | 'timeout' | 'cancel' | 'http' | 'invalid-response' | 'business' | 'unknown'

const defaultMessages: Record<RequestErrorKind, string> = {
  network: '无法连接服务，请检查网络或服务状态。',
  timeout: '请求超时，请稍后重试。',
  cancel: '请求已取消。',
  http: '服务请求失败，请稍后重试。',
  'invalid-response': '接口响应格式异常。',
  business: '服务暂时无法完成此操作。',
  unknown: '请求失败，请稍后重试。',
}

export class RequestError extends Error {
  readonly kind: RequestErrorKind
  readonly httpStatus: number | undefined
  readonly businessCode: ErrorCode | string | undefined
  readonly fields: Record<string, string>
  readonly retryAfterSeconds: number | null
  readonly requestId: string | null

  constructor(
    kind: RequestErrorKind,
    details: {
      message?: string
      httpStatus?: number
      businessCode?: string
      fields?: Record<string, string>
      retryAfterSeconds?: number | null
      requestId?: string | null
    } = {},
  ) {
    super(details.message ?? defaultMessages[kind])
    this.name = 'RequestError'
    this.kind = kind
    this.httpStatus = details.httpStatus
    this.businessCode = details.businessCode
    this.fields = details.fields ?? {}
    this.retryAfterSeconds = details.retryAfterSeconds ?? null
    this.requestId = details.requestId ?? null
  }
}

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    skipEnvelope?: boolean
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean
    skipEnvelope?: boolean
  }
}

function isEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  if (!('code' in value) || !('message' in value) || !('data' in value)) return false
  return typeof value.code === 'string' && typeof value.message === 'string'
}

function retryAfter(response: AxiosResponse<unknown>): number | null {
  const raw = response.headers['retry-after']
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : null
}

function requestIdFromHeader(response: AxiosResponse<unknown>): string | null {
  const raw = response.headers['x-request-id']
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function responseBody(value: unknown): Promise<unknown> {
  if (!(value instanceof Blob)) return value
  try {
    const text = await value.text()
    return JSON.parse(text) as unknown
  } catch {
    return value
  }
}

async function httpFailure(response: AxiosResponse<unknown>): Promise<RequestError> {
  const body = await responseBody(response.data)
  if (isEnvelope(body) && body.code !== 'OK') {
    const fields = body.data?.fields
    return new RequestError('business', {
      message: body.message,
      httpStatus: response.status,
      businessCode: body.code,
      ...(fields ? { fields } : {}),
      retryAfterSeconds: retryAfter(response),
      requestId: body.data?.requestId ?? requestIdFromHeader(response),
    })
  }
  return new RequestError('http', {
    httpStatus: response.status,
    requestId: requestIdFromHeader(response),
  })
}

async function normalizeFailure(error: unknown): Promise<RequestError> {
  if (error instanceof RequestError) return error
  if (axios.isCancel(error)) return new RequestError('cancel')
  if (!axios.isAxiosError(error)) return new RequestError('unknown')
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new RequestError('timeout')
  }
  if (error.response) return httpFailure(error.response)
  return new RequestError('network')
}

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1').replace(
  /\/+$/,
  '',
)

export const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
})

request.interceptors.request.use((config) => {
  config.headers.set('Accept', 'application/json')
  const token = config.skipAuth ? null : getAuthToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

request.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    if (response.config.skipEnvelope) return response
    if (!isEnvelope(response.data)) {
      throw new RequestError('invalid-response', { httpStatus: response.status })
    }
    if (response.data.code !== 'OK') {
      const fields = response.data.data?.fields
      throw new RequestError('business', {
        message: response.data.message,
        httpStatus: response.status,
        businessCode: response.data.code,
        ...(fields ? { fields } : {}),
        retryAfterSeconds: retryAfter(response),
        requestId: response.data.data?.requestId ?? requestIdFromHeader(response),
      })
    }
    return response
  },
  async (error: unknown) => {
    const normalized = await normalizeFailure(error)
    if (
      normalized.httpStatus === 401 &&
      axios.isAxiosError(error) &&
      !error.config?.skipAuth &&
      !window.location.pathname.startsWith('/login')
    ) {
      clearAuthToken()
      const redirect = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
    }
    return Promise.reject(normalized)
  },
)

export function envelopeData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.data.code !== 'OK') throw new RequestError('business')
  return response.data.data
}
