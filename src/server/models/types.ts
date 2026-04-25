import { UserRole } from '../../types';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  sellerId: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentMethod: 'stripe' | 'paypal';
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface Invoice {
  id: string;
  orderId: string;
  formatType: 'pdf' | 'html' | 'json';
  filePath: string;
  generatedAt: string;
}
