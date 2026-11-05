import axios, { type AxiosResponse } from 'axios'

export type RequestErrorKind =
  'network' | 'timeout' | 'cancel' | 'http' | 'invalid-response' | 'business' | 'unknown'

const safeMessages: Record<RequestErrorKind, string> = {
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
  readonly businessCode: string | undefined

  constructor(
    kind: RequestErrorKind,
    details: { httpStatus?: number; businessCode?: string } = {},
  ) {
    super(safeMessages[kind])
    this.name = 'RequestError'
    this.kind = kind
    this.httpStatus = details.httpStatus
    this.businessCode = details.businessCode
  }
}

interface ResponseEnvelope {
  code: string
  message: string
  data: unknown
}

function isEnvelope(value: unknown): value is ResponseEnvelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return (
    'code' in value &&
    typeof value.code === 'string' &&
    value.code.trim().length > 0 &&
    'message' in value &&
    typeof value.message === 'string' &&
    'data' in value &&
    (value.code === 'OK' || value.data === null)
  )
}

function httpFailure(response: AxiosResponse<unknown>): RequestError {
  const body = response.data
  const details = { httpStatus: response.status }
  if (isEnvelope(body) && body.code !== 'OK') {
    return new RequestError('http', { ...details, businessCode: body.code })
  }
  return new RequestError('http', details)
}

function normalizeFailure(error: unknown): RequestError {
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
  return config
})

request.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    // Non-2xx responses are rejected by axios before this handler unless validateStatus is overridden.
    if (!isEnvelope(response.data)) {
      throw new RequestError('invalid-response', { httpStatus: response.status })
    }
    if (response.data.code !== 'OK') {
      throw new RequestError('business', {
        httpStatus: response.status,
        businessCode: response.data.code,
      })
    }
    return response
  },
  (error: unknown) => Promise.reject(normalizeFailure(error)),
)
