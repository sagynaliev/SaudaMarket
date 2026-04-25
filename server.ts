import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { UserRole } from './src/types';
import { InvoiceFactory } from './src/server/patterns/creational/invoice_factory';
import { getPaymentGateway } from './src/server/patterns/structural/payment_adapter';
import { SaudaOrderSubject, EmailNotifier, SMSNotifier, LogNotifier } from './src/server/patterns/behavioral/order_observer';
import { authenticate, authorize, AuthRequest } from './src/server/utils/auth_middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'sauda-engine-super-secret-key';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  // Mock Database (In-Memory)
  const users: any[] = [
    { id: '1', username: 'Alihan Admin', email: 'admin@sauda.io', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { id: '2', username: 'Berik Seller', email: 'seller@sauda.io', password: await bcrypt.hash('seller123', 10), role: 'seller' },
    { id: '3', username: 'Dina Buyer', email: 'user@sauda.io', password: await bcrypt.hash('user123', 10), role: 'customer' }
  ];

  const products: any[] = [
    { id: '1', name: 'Lumix Prime Mirrorless', description: 'High-end mirrorless camera with 4K recording and advanced autofocus system.', price: 1250, stock: 10, categoryId: 'electronics', sellerId: '2', isApproved: true, imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800', reviews: [] },
    { id: '2', name: 'Suede Minimalist Sofa', description: 'Bespoke hand-crafted sofa with premium Italian suede and solid oak legs.', price: 890, stock: 5, categoryId: 'furniture', sellerId: '2', isApproved: true, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800', reviews: [] },
    { id: '3', name: 'MacBook Pro M3 Max', description: 'Powerhouse laptop for creative professionals with stunning Liquid Retina display.', price: 3499, stock: 3, categoryId: 'electronics', sellerId: '2', isApproved: false, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800', reviews: [] }
  ];

  const orders: any[] = [];
  const wishlists: Record<string, string[]> = {};
  const notifications: any[] = [
    { id: '1', userId: '1', title: 'System Update', message: 'Engine v2.4 initialized.', read: false, type: 'info', createdAt: new Date().toISOString() },
    { id: '2', userId: '2', title: 'New Sale', message: 'You have a new order pending confirmation.', read: false, type: 'success', createdAt: new Date().toISOString() }
  ];

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role = 'customer' } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: String(users.length + 1), username, email, password: hashedPassword, role };
    users.push(newUser);
    
    const token = jwt.sign({ id: newUser.id, role, email }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true });
    res.json({ token, user: { id: newUser.id, username, email, role } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset link sent to ' + email });
  });

  app.put('/api/auth/profile', authenticate, async (req: AuthRequest, res) => {
    const user = users.find(u => u.id === req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (req.body.username) user.username = req.body.username;
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    
    res.json({ message: 'Profile updated', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  // --- CATALOG ROUTES ---
  app.get('/api/products', (req, res) => {
    // Normalize: ensure both `category` and `categoryId` fields are present for frontend compatibility
    const normalized = products.map(p => ({
      ...p,
      category: p.category || p.categoryId || 'general',
      categoryId: p.categoryId || p.category || 'general'
    }));
    res.json(normalized);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  });

  app.post('/api/products/:id/review', authenticate, (req: AuthRequest, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    
    const review = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user?.id,
      username: req.user?.email.split('@')[0],
      rating: req.body.rating,
      comment: req.body.comment,
      createdAt: new Date().toISOString()
    };
    
    product.reviews = product.reviews || [];
    product.reviews.push(review);
    res.json(review);
  });

  // --- CUSTOMER ROUTES ---
  app.get('/api/orders', authenticate, (req: AuthRequest, res) => {
    const customerOrders = orders.filter(o => o.customerId === req.user?.id || req.user?.role === 'admin');
    res.json(customerOrders);
  });

  app.post('/api/orders', authenticate, authorize(['customer']), (req: AuthRequest, res) => {
    const { items, totalAmount, paymentMethod } = req.body;
    const orderId = String(orders.length + 1);
    const newOrder = { 
      id: orderId, 
      customerId: req.user?.id, 
      status: 'pending', 
      totalAmount, 
      paymentMethod,
      items: items || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);

    notifications.push({
      id: String(notifications.length + 1),
      userId: '2', // Seller
      title: 'New Order',
      message: `Order #${orderId} received.`,
      read: false,
      type: 'success',
      createdAt: new Date().toISOString()
    });

    res.json(newOrder);
  });

  app.get('/api/wishlist', authenticate, (req: AuthRequest, res) => {
    const list = wishlists[req.user!.id] || [];
    res.json(list);
  });

  app.post('/api/wishlist/:productId', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    if (!wishlists[userId]) wishlists[userId] = [];
    if (!wishlists[userId].includes(req.params.productId)) {
      wishlists[userId].push(req.params.productId);
    }
    res.json(wishlists[userId]);
  });

  app.delete('/api/wishlist/:productId', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    if (wishlists[userId]) {
      wishlists[userId] = wishlists[userId].filter(id => id !== req.params.productId);
    }
    res.json(wishlists[userId] || []);
  });

  // --- NOTIFICATIONS ---
  app.get('/api/notifications', authenticate, (req: AuthRequest, res) => {
    res.json(notifications.filter(n => n.userId === req.user?.id));
  });

  app.put('/api/notifications/:id/read', authenticate, (req, res) => {
    const n = notifications.find(notif => notif.id === req.params.id);
    if (n) n.read = true;
    res.json({ success: true });
  });

  // --- SELLER ROUTES ---
  app.get('/api/seller/dashboard', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const sellerProducts = products.filter(p => p.sellerId === req.user?.id);
    res.json({
      revenue: 15400,
      activeProductsCount: sellerProducts.length,
      recentOrdersCount: orders.length, // Filtered would be better in real app
      products: sellerProducts
    });
  });

  app.post('/api/seller/products', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const newProduct = {
      ...req.body,
      id: String(products.length + 1),
      sellerId: req.user?.id,
      isApproved: false,
      reviews: [],
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    res.json(newProduct);
  });

  app.put('/api/seller/products/:id', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const index = products.findIndex(p => p.id === req.params.id && p.sellerId === req.user?.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
  });

  app.delete('/api/seller/products/:id', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const index = products.findIndex(p => p.id === req.params.id && p.sellerId === req.user?.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(index, 1);
    res.json({ success: true });
  });

  // Seller: view all orders for their products
  app.get('/api/seller/orders', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const sellerProductIds = products.filter(p => p.sellerId === req.user?.id).map(p => p.id);
    const sellerOrders = orders.filter(o =>
      Array.isArray(o.items) && o.items.some((item: any) => sellerProductIds.includes(item.id || item.productId))
    );
    res.json(sellerOrders);
  });

  // Seller: generate invoice for an order
  app.post('/api/seller/invoices/:orderId', authenticate, authorize(['seller']), (req: AuthRequest, res) => {
    const order = orders.find(o => o.id === req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const format = (req.query.format as string) || 'json';
    try {
      const invoice = InvoiceFactory.createInvoice(format as 'pdf' | 'html' | 'json');
      const content = invoice.generate({ ...order, totalAmount: order.totalAmount });
      res.json({ orderId: order.id, format, content });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- ADMIN ROUTES ---
  app.get('/api/admin/dashboard', authenticate, authorize(['admin']), (req, res) => {
    res.json({
      totalRevenue: 245000,
      totalUsers: users.length,
      pendingApprovals: products.filter(p => !p.isApproved).length,
      allProducts: products,
      allUsers: users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role }))
    });
  });

  app.post('/api/admin/products/:id/approve', authenticate, authorize(['admin']), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) product.isApproved = true;
    res.json({ success: true });
  });

  app.post('/api/admin/products/:id/reject', authenticate, authorize(['admin']), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) product.isApproved = false;
    res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', authenticate, authorize(['admin']), (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    const user = users[index];
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });
    users.splice(index, 1);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sauda Engine server running on http://localhost:${PORT}`);
  });
}

startServer();
