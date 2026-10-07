export type Role = 'user' | 'admin'

export type User = {
  readonly username: string
  readonly name: string
  readonly email: string
  readonly role: Role
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered'

export type Order = {
  readonly id: string
  readonly item: string
  readonly total: number
  readonly status: OrderStatus
  readonly placedAt: string
}

export type AdminStats = {
  readonly totalUsers: number
  readonly totalOrders: number
  readonly revenue: number
  readonly activeSessions: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRole(value: unknown): value is Role {
  return value === 'user' || value === 'admin'
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return value === 'processing' || value === 'shipped' || value === 'delivered'
}

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.username === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    isRole(value.role)
  )
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.item === 'string' &&
    typeof value.total === 'number' &&
    isOrderStatus(value.status) &&
    typeof value.placedAt === 'string'
  )
}

export function isUserResponse(
  value: unknown,
): value is { readonly user: User } {
  return isRecord(value) && isUser(value.user)
}

export function isOrdersResponse(
  value: unknown,
): value is { readonly orders: readonly Order[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.orders) &&
    value.orders.every(isOrder)
  )
}

export function isAdminStatsResponse(
  value: unknown,
): value is { readonly stats: AdminStats } {
  if (!isRecord(value) || !isRecord(value.stats)) {
    return false
  }
  const { stats } = value
  return (
    typeof stats.totalUsers === 'number' &&
    typeof stats.totalOrders === 'number' &&
    typeof stats.revenue === 'number' &&
    typeof stats.activeSessions === 'number'
  )
}
