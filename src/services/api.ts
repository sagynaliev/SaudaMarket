const API_BASE = '/api';

let _token: string | null = null;

export const setToken = (t: string | null) => { _token = t; };
export const getToken = () => _token;

function authHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (_token) h['Authorization'] = `Bearer ${_token}`;
  return h;
}

async function apiFetch(path: string, method = 'GET', body?: object) {
  const opts: RequestInit = {
    method,
    headers: authHeaders(),
    credentials: 'include'
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${API_BASE}${path}`, opts);
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Auth failed'); }
      const data = await res.json();
      if (data.token) setToken(data.token);
      return data;
    },
    register: async (userData: any) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Registration failed'); }
      const data = await res.json();
      if (data.token) setToken(data.token);
      return data;
    },
    logout: async () => {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      setToken(null);
    },
    forgotPassword: async (email: string) => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return res.json();
    },
    updateProfile: async (data: any) => {
      const res = await apiFetch('/auth/profile', 'PUT', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed'); }
      return res.json();
    }
  },
  products: {
    list: async () => {
      const res = await fetch(`${API_BASE}/products`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE}/products/${id}`, { credentials: 'include' });
      return res.json();
    },
    addReview: async (id: string, review: { rating: number; comment: string }) => {
      const res = await apiFetch(`/products/${id}/review`, 'POST', review);
      return res.json();
    }
  },
  orders: {
    list: async () => {
      const res = await apiFetch('/orders');
      if (!res.ok) return [];
      return res.json();
    },
    create: async (orderData: any) => {
      const res = await apiFetch('/orders', 'POST', orderData);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Order failed'); }
      return res.json();
    }
  },
  wishlist: {
    list: async () => {
      const res = await apiFetch('/wishlist');
      if (!res.ok) return [];
      return res.json();
    },
    toggle: async (productId: string, isActive: boolean) => {
      const res = await apiFetch(`/wishlist/${productId}`, isActive ? 'DELETE' : 'POST');
      if (!res.ok) return [];
      return res.json();
    }
  },
  notifications: {
    list: async () => {
      const res = await apiFetch('/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    markAsRead: async (id: string) => {
      const res = await apiFetch(`/notifications/${id}/read`, 'PUT');
      return res.json();
    }
  },
  seller: {
    getDashboard: async () => {
      const res = await apiFetch('/seller/dashboard');
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Dashboard failed'); }
      return res.json();
    },
    getOrders: async () => {
      const res = await apiFetch('/seller/orders');
      if (!res.ok) return [];
      return res.json();
    },
    addProduct: async (data: any) => {
      const res = await apiFetch('/seller/products', 'POST', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Add product failed'); }
      return res.json();
    },
    updateProduct: async (id: string, data: any) => {
      const res = await apiFetch(`/seller/products/${id}`, 'PUT', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed'); }
      return res.json();
    },
    deleteProduct: async (id: string) => {
      const res = await apiFetch(`/seller/products/${id}`, 'DELETE');
      return res.json();
    },
    generateInvoice: async (orderId: string, format: string) => {
      const res = await apiFetch(`/seller/invoices/${orderId}?format=${format}`, 'POST');
      return res.json();
    }
  },
  admin: {
    getDashboard: async () => {
      const res = await apiFetch('/admin/dashboard');
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Admin dashboard failed'); }
      return res.json();
    },
    approveProduct: async (id: string) => {
      const res = await apiFetch(`/admin/products/${id}/approve`, 'POST');
      return res.json();
    },
    rejectProduct: async (id: string) => {
      const res = await apiFetch(`/admin/products/${id}/reject`, 'POST');
      return res.json();
    },
    deleteUser: async (id: string) => {
      const res = await apiFetch(`/admin/users/${id}`, 'DELETE');
      return res.json();
    }
  }
};
