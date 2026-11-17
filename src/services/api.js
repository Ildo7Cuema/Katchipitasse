import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  demoCategories,
  demoDishes,
  demoRooms,
  demoSettings,
} from '@/lib/demoData'
import {
  EMPTY_PAYMENT_GPO,
  normalizePaymentGpo,
  paymentGpoFormToRpcPayload,
} from '@/lib/paymentGpo'
import { fallbackPlatformGpo } from '@/lib/subscriptionBilling'
import { resolveAnnualPeriod } from '@/lib/subscriptionPeriod'
import { requestAdminPush } from '@/lib/webPush'

function requireClient() {
  if (!supabase) throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export async function getCompanySettings() {
  if (!isSupabaseConfigured) return demoSettings
  const { data, error } = await requireClient().from('company_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

const COMPANY_MEDIA_KEYS = [
  'restaurant_cover_url',
  'lodging_cover_url',
  'contacts_cover_url',
  'hero_images',
]

export async function updateCompanySettings(payload) {
  const client = requireClient()
  const media = {}
  const core = { ...payload }
  for (const key of COMPANY_MEDIA_KEYS) {
    if (Object.prototype.hasOwnProperty.call(core, key)) {
      media[key] = core[key]
      delete core[key]
    }
  }

  const { data, error } = await client.from('company_settings').update(core).eq('id', 1).select().single()
  if (error) throw error

  if (Object.keys(media).length === 0) return data

  const { data: withMedia, error: mediaError } = await client
    .from('company_settings')
    .update(media)
    .eq('id', 1)
    .select()
    .single()

  if (!mediaError) return withMedia

  const migrationNeeded = /column|schema cache|does not exist/i.test(mediaError.message || '')
  if (migrationNeeded) {
    const err = new Error(
      'Contactos guardados. Para imagens personalizadas, execute a migration 010_public_page_images.sql no Supabase.',
    )
    err.code = 'MEDIA_MIGRATION_REQUIRED'
    err.partialData = { ...data, ...media }
    throw err
  }
  throw mediaError
}

export async function getCategories() {
  if (!isSupabaseConfigured) return demoCategories
  const { data, error } = await requireClient()
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function saveCategory(payload, id) {
  const client = requireClient()
  if (id) {
    const { data, error } = await client.from('categories').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await requireClient().from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function getDishes() {
  if (!isSupabaseConfigured) return demoDishes
  const { data, error } = await requireClient()
    .from('dishes')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getDish(id) {
  if (!isSupabaseConfigured) {
    const dish = demoDishes.find((d) => d.id === id)
    if (!dish) throw new Error('Prato não encontrado')
    return dish
  }
  const { data, error } = await requireClient().from('dishes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function saveDish(payload, id) {
  const client = requireClient()
  if (id) {
    const { data, error } = await client.from('dishes').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('dishes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteDish(id) {
  const { error } = await requireClient().from('dishes').delete().eq('id', id)
  if (error) throw error
}

export async function getRooms() {
  if (!isSupabaseConfigured) return demoRooms
  const { data, error } = await requireClient()
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRoom(id) {
  if (!isSupabaseConfigured) {
    const room = demoRooms.find((r) => r.id === id)
    if (!room) throw new Error('Quarto não encontrado')
    return room
  }
  const { data, error } = await requireClient().from('rooms').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function saveRoom(payload, id) {
  const client = requireClient()
  if (id) {
    const { data, error } = await client.from('rooms').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('rooms').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteRoom(id) {
  const { error } = await requireClient().from('rooms').delete().eq('id', id)
  if (error) throw error
}

export async function checkRoomAvailability(roomId, checkIn, checkOut, excludeId = null) {
  if (!isSupabaseConfigured) return true
  const { data, error } = await requireClient().rpc('check_room_availability', {
    p_room_id: roomId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_exclude_id: excludeId,
  })
  if (error) throw error
  return Boolean(data)
}

export async function createOrder({ userId, customerName, customerPhone, notes, items }) {
  const client = requireClient()
  const { data: order, error } = await client
    .from('orders')
    .insert({
      user_id: userId,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes || null,
      status: 'pendente',
    })
    .select()
    .single()
  if (error) throw error

  const lines = items.map((item) => ({
    order_id: order.id,
    dish_id: item.dish_id,
    dish_name: item.dish_name,
    unit_price: item.unit_price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await client.from('order_items').insert(lines)
  if (itemsError) throw itemsError

  void requestAdminPush({
    title: 'Novo pedido',
    body: `${customerName || 'Cliente'} · ${customerPhone || 'sem telefone'}`,
    url: '/admin/pedidos',
  })

  void logUsageEvent({
    userId,
    role: 'cliente',
    eventType: 'order',
    path: '/restaurante',
    channel: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches ? 'pwa' : 'web',
    meta: { order_id: order.id },
  })

  return order
}

export async function getMyOrders(userId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await requireClient()
    .from('orders')
    .select('*, order_items(*, dishes(id, name, image_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllOrders() {
  const { data, error } = await requireClient()
    .from('orders')
    .select('*, order_items(*, dishes(id, name, image_url)), profiles(full_name, email, phone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Pedidos recentes para o sino de notificações do admin. */
export async function getRecentOrdersForNotifications(limit = 25) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await requireClient()
    .from('orders')
    .select('id, customer_name, customer_phone, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

/** Reservas recentes para o sino de notificações do admin. */
export async function getRecentReservationsForNotifications(limit = 25) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await requireClient()
    .from('reservations')
    .select('id, customer_name, guests, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await requireClient()
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createReservation(payload) {
  const available = await checkRoomAvailability(payload.room_id, payload.check_in, payload.check_out)
  if (!available) {
    throw new Error('Quarto indisponível para o período seleccionado.')
  }

  const { data, error } = await requireClient()
    .from('reservations')
    .insert({ ...payload, status: 'pendente' })
    .select()
    .single()
  if (error) {
    if (error.message?.includes('indisponível')) {
      throw new Error('Quarto indisponível para o período seleccionado.')
    }
    throw error
  }

  void requestAdminPush({
    title: 'Nova reserva',
    body: `${payload.customer_name || 'Cliente'} · ${payload.guests || 1} hóspede(s)`,
    url: '/admin/reservas',
  })

  void logUsageEvent({
    userId: payload.user_id || null,
    role: 'cliente',
    eventType: 'reservation',
    path: '/hospedaria',
    channel: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches ? 'pwa' : 'web',
    meta: { reservation_id: data.id },
  })

  return data
}

export async function getMyReservations(userId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await requireClient()
    .from('reservations')
    .select('*, rooms(name, image_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllReservations() {
  const { data, error } = await requireClient()
    .from('reservations')
    .select('*, rooms(name, image_url), profiles(full_name, email, phone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateReservationStatus(id, status) {
  const { data, error } = await requireClient()
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    if (error.message?.includes('indisponível')) {
      throw new Error('Não é possível confirmar: conflito de disponibilidade.')
    }
    throw error
  }
  return data
}

export async function getCustomers() {
  const { data, error } = await requireClient()
    .from('profiles')
    .select('*')
    .eq('role', 'cliente')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getStaffProfiles() {
  const { data, error } = await requireClient()
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'super_admin', 'cliente'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateUserRole(userId, role) {
  const { data, error } = await requireClient()
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function touchLastSeen() {
  if (!isSupabaseConfigured) return
  try {
    await requireClient().rpc('touch_profile_last_seen')
  } catch {
    /* migration 012 opcional */
  }
}

export async function logUsageEvent({
  userId = null,
  guestKey = null,
  role = null,
  eventType,
  path = null,
  channel = 'unknown',
  meta = {},
}) {
  if (!isSupabaseConfigured) return null
  const client = requireClient()
  const payload = {
    user_id: userId || null,
    guest_key: userId ? null : guestKey,
    role: role || null,
    event_type: eventType,
    path: path || null,
    channel,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 280) : null,
    meta,
  }
  const { error } = await client.from('app_usage_events').insert(payload)
  if (error) {
    // Não quebrar a UX se a migration 012 ainda não foi aplicada
    console.warn('logUsageEvent', error.message)
    return null
  }
  if (userId) void touchLastSeen()
  return true
}

export async function getPlatformUsageSummary(hours = 24) {
  const { data, error } = await requireClient().rpc('get_platform_usage_summary', {
    p_hours: hours,
  })
  if (error) throw error
  return data
}

export async function getRecentUsageEvents(limit = 80) {
  const { data, error } = await requireClient()
    .from('app_usage_events')
    .select('*, profiles(full_name, email, phone, role)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getActiveUsers(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const { data, error } = await requireClient()
    .from('profiles')
    .select('id, full_name, email, phone, role, last_seen_at, created_at')
    .gte('last_seen_at', since)
    .order('last_seen_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getDashboardStats() {
  const client = requireClient()
  const [customers, orders, reservations, rooms, staff, dishes, pendingOrders] = await Promise.all([
    client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'cliente'),
    client.from('orders').select('id, status', { count: 'exact' }),
    client.from('reservations').select('id, status', { count: 'exact' }),
    client.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['admin', 'super_admin']),
    client.from('dishes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])

  if (customers.error) throw customers.error
  if (orders.error) throw orders.error
  if (reservations.error) throw reservations.error
  if (rooms.error) throw rooms.error

  const pendingReservations = (reservations.data || []).filter((r) => r.status === 'pendente').length
  const confirmedReservations = (reservations.data || []).filter((r) => r.status === 'confirmada').length
  const completedOrders = (orders.data || []).filter((o) => o.status === 'concluido').length

  return {
    customers: customers.count || 0,
    orders: orders.count || 0,
    reservations: reservations.count || 0,
    pendingReservations,
    confirmedReservations,
    pendingOrders: pendingOrders.error ? 0 : pendingOrders.count || 0,
    completedOrders,
    activeRooms: rooms.count || 0,
    activeDishes: dishes.error ? 0 : dishes.count || 0,
    staff: staff.error ? 0 : staff.count || 0,
  }
}

export async function getSubscription() {
  const { data, error } = await requireClient()
    .from('app_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAppLockStatus() {
  const { data, error } = await requireClient().rpc('get_app_lock_status')
  if (error) throw error
  return data || {
    is_blocked: false,
    block_reason: null,
    status: null,
    ends_at: null,
    plan_name: null,
    billing_cycle: 'annual',
  }
}

function normalizeSubscriptionPayload(payload, existing = null) {
  const period = resolveAnnualPeriod(existing, { renew: Boolean(payload.renew) })
  const next = {
    plan_name: payload.plan_name || 'Anual',
    status: payload.status || 'active',
    starts_at: period.starts_at,
    ends_at: period.ends_at,
    annual_fee: Number(payload.annual_fee ?? payload.monthly_fee) || 0,
    billing_cycle: 'annual',
    max_admins: Number(payload.max_admins) || 1,
    max_rooms: Number(payload.max_rooms) || 1,
    notes: payload.notes || null,
  }
  if (typeof payload.is_blocked === 'boolean') {
    next.is_blocked = payload.is_blocked
    next.block_reason = payload.is_blocked ? payload.block_reason || null : null
    next.blocked_at = payload.is_blocked ? payload.blocked_at || new Date().toISOString() : null
  }
  return next
}

export async function saveSubscription(payload, id) {
  const client = requireClient()
  const existing = await getSubscription()
  const body = normalizeSubscriptionPayload(payload, existing)
  if (id || existing?.id) {
    const targetId = id || existing.id
    const { data, error } = await client.from('app_subscriptions').update(body).eq('id', targetId).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('app_subscriptions').insert(body).select().single()
  if (error) throw error
  return data
}

export async function setAppBlocked({ blocked, reason, status, renewOnUnblock = true } = {}) {
  const current = await getSubscription()
  if (!current?.id) throw new Error('Assinatura não encontrada. Execute a migration 004.')
  const nextStatus = status || (blocked ? 'suspended' : current.status === 'suspended' ? 'active' : current.status)
  const payload = {
    plan_name: current.plan_name,
    status: nextStatus,
    annual_fee: current.annual_fee ?? current.monthly_fee ?? 0,
    max_admins: current.max_admins,
    max_rooms: current.max_rooms,
    notes: current.notes,
    is_blocked: Boolean(blocked),
    block_reason: blocked
      ? reason || 'Bloqueada por irregularidade de pagamento ou risco para a aplicação.'
      : null,
    blocked_at: blocked ? new Date().toISOString() : null,
    // Ao desbloquear após pagamento, o sistema renova automaticamente o ciclo anual
    renew: !blocked && renewOnUnblock,
  }
  return saveSubscription(payload, current.id)
}

export async function requestSubscriptionPayment({ note, method } = {}) {
  const { data, error } = await requireClient().rpc('request_subscription_payment', {
    p_note: note || null,
    p_method: method || null,
  })
  if (error) throw error
  return data
}

export async function confirmSubscriptionPayment() {
  const { data, error } = await requireClient().rpc('confirm_subscription_payment')
  if (error) throw error
  return data
}

function demoPaymentGpo(scope) {
  if (scope === 'platform') return normalizePaymentGpo(fallbackPlatformGpo(), 'platform')
  return normalizePaymentGpo({ ...EMPTY_PAYMENT_GPO, scope: 'store', enabled: false }, 'store')
}

async function fetchPaymentGpoRow(scope) {
  const { data, error } = await requireClient().from('payment_gpo').select('*').eq('scope', scope).maybeSingle()
  if (error) return demoPaymentGpo(scope)
  if (!data) return demoPaymentGpo(scope)
  return normalizePaymentGpo(data, scope)
}

/** Leitura segura (sem segredos). Store: público. Platform: admin. */
export async function getPaymentGpoSafe(scope) {
  if (!isSupabaseConfigured) return demoPaymentGpo(scope)
  const { data, error } = await requireClient().rpc('get_payment_gpo_safe', { p_scope: scope })
  if (error) {
    // Migration 008 ainda não aplicada — tenta select directo (legado 007)
    return fetchPaymentGpoRow(scope)
  }
  return normalizePaymentGpo(data || { scope }, scope)
}

/**
 * @param {string} scope
 * @param {{ includeSecrets?: boolean }} [options]
 * includeSecrets=true → RPC admin mascarada (nunca devolve segredos em claro)
 */
export async function getPaymentGpo(scope, { includeSecrets = false } = {}) {
  if (!isSupabaseConfigured) return demoPaymentGpo(scope)
  if (!includeSecrets) return getPaymentGpoSafe(scope)

  const { data, error } = await requireClient().rpc('get_payment_gpo_admin', { p_scope: scope })
  if (error) {
    // Migration 009 ainda não aplicada — fallback sem expor se possível
    return fetchPaymentGpoRow(scope)
  }
  return normalizePaymentGpo(data || { scope }, scope)
}

export async function savePaymentGpo(scope, form) {
  const payload = paymentGpoFormToRpcPayload({ ...form, scope })
  const { data, error } = await requireClient().rpc('save_payment_gpo', {
    p_scope: scope,
    p_payload: payload,
  })
  if (error) {
    // Fallback legado (007/008) — evitar se possível
    const { data: row, error: upsertError } = await requireClient()
      .from('payment_gpo')
      .upsert(payload, { onConflict: 'scope' })
      .select()
      .single()
    if (upsertError) throw error
    return normalizePaymentGpo(row, scope)
  }
  return normalizePaymentGpo(data || { scope }, scope)
}

export async function getSystemRules() {
  const { data, error } = await requireClient()
    .from('system_rules')
    .select('*')
    .order('title', { ascending: true })
  if (error) throw error
  return data || []
}

export async function saveSystemRule(payload, id) {
  const client = requireClient()
  if (id) {
    const { data, error } = await client.from('system_rules').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('system_rules').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function uploadImage(bucket, file) {
  const client = requireClient()
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = client.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function updateProfile(userId, payload) {
  const { data, error } = await requireClient()
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
