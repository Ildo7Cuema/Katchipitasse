# Database — Katchiitassi Elavoko

## Entities
- `profiles` — extends auth.users
- `categories` — dish categories
- `dishes` — menu items
- `rooms` — lodging rooms
- `orders` — meal requests
- `order_items` — line items
- `reservations` — room bookings
- `company_settings` — singleton company info

## Availability rule
A reservation conflicts when room_id matches and status NOT IN ('cancelada') and date ranges overlap:
`check_in < existing.check_out AND check_out > existing.check_in`

Enforced by function `assert_room_available` called by trigger BEFORE INSERT/UPDATE on reservations.

## Roles
- `profiles.role`: `cliente` | `admin`
