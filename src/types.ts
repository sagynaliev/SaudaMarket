export type UserRole = 'admin' | 'seller' | 'customer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sellerId: string;
  imageUrl: string;
  isApproved: boolean;
  rating: number;
  reviews?: any[];
  weight?: number;
  isDigital?: boolean;
  fileSize?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'stripe' | 'paypal';
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentProvider = 'stripe' | 'paypal';
