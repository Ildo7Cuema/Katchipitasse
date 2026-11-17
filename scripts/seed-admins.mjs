/**
 * Cria/actualiza contas seed de administradores.
 *
 * Uso:
 *   node --env-file=.env scripts/seed-admins.mjs
 *
 * Obrigatório no .env (nunca commitar passwords):
 *   SEED_SUPERADMIN_EMAIL=
 *   SEED_SUPERADMIN_PASSWORD=
 *   SEED_STOREADMIN_EMAIL=
 *   SEED_STOREADMIN_PASSWORD=
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SECRET_KEY

const seeds = [
  {
    email: process.env.SEED_SUPERADMIN_EMAIL,
    password: process.env.SEED_SUPERADMIN_PASSWORD,
    full_name: process.env.SEED_SUPERADMIN_NAME || 'Super Admin',
    phone: process.env.SEED_SUPERADMIN_PHONE || '',
    role: 'super_admin',
  },
  {
    email: process.env.SEED_STOREADMIN_EMAIL,
    password: process.env.SEED_STOREADMIN_PASSWORD,
    full_name: process.env.SEED_STOREADMIN_NAME || 'Administrador da Loja',
    phone: process.env.SEED_STOREADMIN_PHONE || '',
    role: 'admin',
  },
]

if (!url || !serviceKey) {
  console.error('Defina VITE_SUPABASE_URL e SUPABASE_SECRET_KEY no .env')
  process.exit(1)
}

for (const seed of seeds) {
  if (!seed.email || !seed.password) {
    console.error(
      'Defina SEED_SUPERADMIN_EMAIL/PASSWORD e SEED_STOREADMIN_EMAIL/PASSWORD no .env (não use passwords no código).',
    )
    process.exit(1)
  }
  if (String(seed.password).length < 10) {
    console.error(`Password demasiado curta para ${seed.email} (mín. 10 caracteres).`)
    process.exit(1)
  }
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function upsertAuthUser(seed) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError

  const existing = listed.users.find((u) => u.email?.toLowerCase() === seed.email.toLowerCase())

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: seed.password,
      email_confirm: true,
      user_metadata: { full_name: seed.full_name, phone: seed.phone },
    })
    if (error) throw error
    return data.user
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: { full_name: seed.full_name, phone: seed.phone },
  })
  if (error) throw error
  return data.user
}

async function upsertProfile(user, seed) {
  const base = {
    id: user.id,
    full_name: seed.full_name,
    phone: seed.phone || null,
    email: seed.email,
    role: 'admin',
  }

  const { error } = await admin.from('profiles').upsert(base, { onConflict: 'id' })
  if (error) throw error

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: seed.role, full_name: seed.full_name, email: seed.email })
    .eq('id', user.id)
  if (roleError) {
    console.warn(
      `Aviso: não foi possível definir role=${seed.role} para ${seed.email}.`,
      'Execute supabase/migrations/002_roles_super_admin.sql e volte a correr este script.',
    )
    console.warn(roleError.message)
  }
}

for (const seed of seeds) {
  const user = await upsertAuthUser(seed)
  await upsertProfile(user, seed)
  console.log(`OK ${seed.role}: ${seed.email} (${user.id})`)
}

console.log('\nSeed de administradores concluída. Altere as passwords após o primeiro acesso em produção.')
