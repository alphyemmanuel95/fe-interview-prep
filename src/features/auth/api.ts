import type { ApiClient } from './apiClient'
import { isAdminStatsResponse, isOrdersResponse, isUserResponse } from './types'
import type { AdminStats, Order, User } from './types'

export async function fetchCurrentUser(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<User> {
  const body = await client.getJson(
    '/api/me',
    isUserResponse,
    signalInit(signal),
  )
  return body.user
}

export async function fetchOrders(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<readonly Order[]> {
  const body = await client.getJson(
    '/api/orders',
    isOrdersResponse,
    signalInit(signal),
  )
  return body.orders
}

export async function fetchAdminStats(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<AdminStats> {
  const body = await client.getJson(
    '/api/admin/stats',
    isAdminStatsResponse,
    signalInit(signal),
  )
  return body.stats
}

function signalInit(signal: AbortSignal | undefined): RequestInit {
  return signal === undefined ? {} : { signal }
}
