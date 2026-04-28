import { UserRole, Product } from '../types';

const API_BASE = '/api';

/**
 * Centralized API Fetcher with JWT Injection and Persistence
 */
const fetcher = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('sauda_jwt');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
   if (response.status === 401) {
    localStorage.removeItem('sauda_jwt');
    localStorage.removeItem('sauda_user');
    window.dispatchEvent(new CustomEvent('sauda-unauthorized'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Network response was not ok');
  }

  return response.json();
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const data = await fetcher('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) localStorage.setItem('sauda_jwt', data.token);
      if (data.user) localStorage.setItem('sauda_user', JSON.stringify(data.user));
      return data;
    },
    register: async (userData: any) => {
      const data = await fetcher('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (data.token) localStorage.setItem('sauda_jwt', data.token);
      if (data.user) localStorage.setItem('sauda_user', JSON.stringify(data.user));
      return data;
    },
    logout: async () => {
      try {
        await fetcher('/auth/logout', { method: 'POST' });
      } catch (err) {
        // Silently fail if server is down
      }
      localStorage.removeItem('sauda_jwt');
      localStorage.removeItem('sauda_user');
    },
    forgotPassword: async (email: string) => {
      return fetcher('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    updateProfile: async (data: any) => {
      const updated = await fetcher('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (updated.user) localStorage.setItem('sauda_user', JSON.stringify(updated.user));
      return updated;
    }
  },
  products: {
    list: async () => fetcher('/products'),
    get: async (id: string) => fetcher(`/products/${id}`),
    addReview: async (id: string, review: { rating: number; comment: string }) => {
      return fetcher(`/products/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(review)
      });
    }
  },
  orders: {
    list: async () => fetcher('/orders'),
    getInvoice: async (id: string) => fetcher(`/orders/${id}/invoice`),
    create: async (orderData: any) => {
      return fetcher('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    }
  },
  wishlist: {
    list: async () => fetcher('/wishlist'),
    toggle: async (productId: string, isActive: boolean) => {
      const method = isActive ? 'DELETE' : 'POST';
      return fetcher(`/wishlist/${productId}`, { method });
    }
  },
  notifications: {
    list: async () => fetcher('/notifications'),
    markAsRead: async (id: string) => {
      return fetcher(`/notifications/${id}/read`, { method: 'PUT' });
    }
  },
  seller: {
    getDashboard: async () => fetcher('/seller/dashboard'),
    getOrders: async () => fetcher('/seller/orders'),
    addProduct: async (data: any) => {
      return fetcher('/seller/products', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    updateProduct: async (id: string, data: any) => {
      return fetcher(`/seller/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    updateOrderStatus: async (orderId: string, status: string) => {
      return fetcher(`/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    deleteProduct: async (id: string) => {
      return fetcher(`/seller/products/${id}`, { method: 'DELETE' });
    },
    generateInvoice: async (orderId: string, format: string = 'pdf') => {
      return fetcher(`/seller/invoices/${orderId}?format=${format}`, { method: 'POST' });
    }
  },
  admin: {
    getDashboard: async () => fetcher('/admin/dashboard'),
    approveProduct: async (id: string) => {
      return fetcher(`/admin/products/${id}/approve`, { method: 'POST' });
    },
    rejectProduct: async (id: string) => {
      return fetcher(`/admin/products/${id}/reject`, { method: 'POST' });
    },
    deleteUser: async (id: string) => {
      return fetcher(`/admin/users/${id}`, { method: 'DELETE' });
    },
    broadcast: async (data: { title: string, content: string }) => {
      return fetcher('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  messages: {
    list: async () => fetcher('/messages'),
    getEligibleContacts: async () => fetcher('/messages/eligible-contacts'),
    send: async (data: { toId: string, text: string }) => {
      return fetcher('/messages', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  search: {
    global: async (query: string) => fetcher(`/search?q=${encodeURIComponent(query)}`)
  }
};
