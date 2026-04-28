import { Product, User, Order } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin_sauda', email: 'admin@sauda.io', role: 'admin' },
  { id: '2', username: 'seller_one', email: 'seller@store.com', role: 'seller' },
  { id: '3', username: 'customer_ali', email: 'ali@user.kz', role: 'customer' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Lumix Prime Mirrorless',
    description: 'High-end mirrorless camera with 4K recording and dual stabilization.',
    price: 1250.00,
    stock: 12,
    category: 'Electronics',
    sellerId: '2',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
    isApproved: true,
    rating: 4.8
  },
  {
    id: 'p2',
    name: 'Suede Minimalist Sofa',
    description: 'Bespoke hand-crafted suede sofa with ergonomic design.',
    price: 890.00,
    stock: 5,
    category: 'Furniture',
    sellerId: '2',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000',
    isApproved: true,
    rating: 4.5
  },
  {
    id: 'p3',
    name: 'Sauda Signature Watch',
    description: 'Limited edition mechanical watch with leather strap.',
    price: 450.00,
    stock: 20,
    category: 'Fashion',
    sellerId: '2',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1000',
    isApproved: false,
    rating: 0
  },
  {
    id: 'p4',
    name: 'Neural Headphones',
    description: 'Noise-cancelling headphones with adaptive sound profiles.',
    price: 299.00,
    stock: 45,
    category: 'Electronics',
    sellerId: '2',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000',
    isApproved: true,
    rating: 4.9
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    customerId: '3',
    items: [{ productId: 'p1', quantity: 1, price: 1250.00 }],
    total: 1250.00,
    status: 'delivered',
    paymentMethod: 'stripe',
    createdAt: '2024-03-20T10:00:00Z'
  },
  {
    id: 'ord-002',
    customerId: '3',
    items: [{ productId: 'p4', quantity: 1, price: 299.00 }],
    total: 299.00,
    status: 'shipped',
    paymentMethod: 'paypal',
    createdAt: '2024-03-24T15:30:00Z'
  }
];
