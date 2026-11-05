export type ConnectionState = 'checking' | 'healthy' | 'unhealthy' | 'unknown'

export interface ConnectionStatus {
  state: ConnectionState
  description: string
}
