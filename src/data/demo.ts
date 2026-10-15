import type { Category, Deposit, Item } from '../types'

// Временные данные для этапа вёрстки — заменятся данными из Supabase.

export const demoCategories: Category[] = [
  { id: 'c1', name: 'Техника', color: '#5b4bdb' },
  { id: 'c2', name: 'Одежда', color: '#d9467a' },
  { id: 'c3', name: 'Хобби', color: '#1f9d8b' },
]

const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=600&q=70&auto=format&fit=crop`

export const demoItems: Item[] = [
  {
    id: 'i1',
    title: 'Наушники с шумоподавлением',
    url: 'https://example.com/headphones',
    image_url: unsplash('photo-1505740420928-5e560c06d30e'),
    price: 24990,
    currency: 'RUB',
    category_id: 'c1',
    priority: 1,
    target_date: '2026-12-31',
    status: 'wanted',
    bought_at: null,
    position: 1,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'i2',
    title: 'Кроссовки для бега',
    url: 'https://example.com/sneakers',
    image_url: unsplash('photo-1542291026-7eec264c27ff'),
    price: 129,
    currency: 'USD',
    category_id: 'c2',
    priority: 2,
    target_date: null,
    status: 'wanted',
    bought_at: null,
    position: 2,
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'i3',
    title: 'Плёночный фотоаппарат',
    url: 'https://example.com/camera',
    image_url: unsplash('photo-1526170375885-4d8ecf77b99f'),
    price: 899,
    currency: 'CNY',
    category_id: 'c3',
    priority: 3,
    target_date: '2027-03-01',
    status: 'wanted',
    bought_at: null,
    position: 3,
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'i4',
    title: 'Ноутбук для учёбы',
    url: 'https://example.com/laptop',
    image_url: unsplash('photo-1496181133206-80ce9b88a853'),
    price: 1199,
    currency: 'USD',
    category_id: 'c1',
    priority: 1,
    target_date: '2027-06-01',
    status: 'wanted',
    bought_at: null,
    position: 4,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'i5',
    title: 'Часы',
    url: null,
    image_url: unsplash('photo-1523275335684-37898b6baf30'),
    price: 15500,
    currency: 'RUB',
    category_id: null,
    priority: 2,
    target_date: null,
    status: 'wanted',
    bought_at: null,
    position: 5,
    created_at: '2026-10-05T10:00:00Z',
  },
]

export const demoDeposits: Deposit[] = [
  { id: 'd1', amount: 20000, currency: 'RUB', note: 'Стипендия', item_id: null, created_at: '2026-08-15T10:00:00Z' },
  { id: 'd2', amount: 100, currency: 'USD', note: 'Подарок', item_id: null, created_at: '2026-09-05T10:00:00Z' },
  { id: 'd3', amount: 12000, currency: 'RUB', note: null, item_id: null, created_at: '2026-10-01T10:00:00Z' },
]
