/** Dados locais usados apenas quando o Supabase ainda não está configurado. */

export const demoSettings = {
  company_name: 'Katchipitasse Elavoko',
  tagline: 'Restaurante & Hospedaria',
  description:
    'Hospitalidade autêntica, refeições saborosas e quartos acolhedores. Bem-vindo à Katchipitasse Elavoko.',
  logo_url: '/logo.png',
  phone: '+244 900 000 000',
  whatsapp: '+244900000000',
  email: 'contacto@katchiitassi.ao',
  address: 'Luanda, Angola',
  maps_url: 'https://maps.google.com',
  opening_hours: 'Restaurante: 07:00–22:00 | Recepção: 24h',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  privacy_policy_url: '/privacidade',
  restaurant_cover_url: null,
  lodging_cover_url: null,
  contacts_cover_url: null,
  hero_images: [],
}

export const demoCategories = [
  { id: 'c1', name: 'Pratos principais', sort_order: 1, is_active: true },
  { id: 'c2', name: 'Entradas', sort_order: 2, is_active: true },
  { id: 'c3', name: 'Bebidas', sort_order: 3, is_active: true },
]

export const demoDishes = [
  {
    id: 'd1',
    category_id: 'c1',
    name: 'Muamba de Galinha',
    description: 'Galinha estufada com quiabo, dendém e funge.',
    price: 4500,
    image_url:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'd2',
    category_id: 'c1',
    name: 'Peixe Grelhado',
    description: 'Peixe fresco grelhado com legumes da época.',
    price: 5500,
    image_url:
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'd3',
    category_id: 'c2',
    name: 'Salada da Casa',
    description: 'Mistura fresca com molho de limão e azeite.',
    price: 2500,
    image_url:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
    is_active: true,
  },
  {
    id: 'd4',
    category_id: 'c3',
    name: 'Sumo Natural',
    description: 'Maracujá, manga ou laranja — escolha do dia.',
    price: 1200,
    image_url:
      'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
    is_active: true,
  },
]

export const demoRooms = [
  {
    id: 'r1',
    name: 'Quarto Standard',
    description: 'Conforto essencial com vista para o jardim.',
    features: 'Wi-Fi, AC, casa de banho privativa, TV',
    price_per_night: 18000,
    max_guests: 2,
    image_url:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'r2',
    name: 'Suíte Familiar',
    description: 'Espaço amplo para famílias, com área de estar.',
    features: 'Wi-Fi, AC, 2 camas, frigobar, varanda',
    price_per_night: 32000,
    max_guests: 4,
    image_url:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'r3',
    name: 'Quarto Executivo',
    description: 'Ambiente sereno para descanso e trabalho.',
    features: 'Wi-Fi, AC, secretária, casa de banho privativa',
    price_per_night: 25000,
    max_guests: 2,
    image_url:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    is_featured: false,
    is_active: true,
  },
]
