import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PricingEngine, StandardPricingStrategy, VIPPricingStrategy, SeasonalSalePricingStrategy, BulkOrderPricingStrategy } from './src/server/patterns/behavioral/pricing_strategy.js';
import { CurrencyAdapterFactory } from './src/server/patterns/structural/currency_adapter.js';
import { InvoiceFactory } from './src/server/patterns/creational/invoice_factory.js';
import { getPaymentGateway } from './src/server/patterns/structural/payment_adapter.js';
import { SaudaOrderSubject, EmailNotifier, SMSNotifier, LogNotifier } from './src/server/patterns/behavioral/order_observer.js';
import { ReviewSubject, SellerReviewNotifier, AdminAuditLogger, RatingAggregator } from './src/server/patterns/behavioral/review_observer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'sauda-engine-super-secret-key';

// --- AUTH MIDDLEWARE ---
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : req.cookies.token;
  
  if (!token) return res.status(401).json({ error: 'Unauthorized: Session terminated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired' });
  }
};

const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Access restricted' });
  }
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  // --- DATA MODELS ---
  const users: any[] = [
    { id: '1', username: 'Alihan Admin', email: 'admin@sauda.io', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { id: '2', username: 'Berik Seller', email: 'seller@sauda.io', password: await bcrypt.hash('seller123', 10), role: 'seller' },
    { id: '3', username: 'Dina Buyer', email: 'user@sauda.io', password: await bcrypt.hash('user123', 10), role: 'customer' }
  ];

  const products: any[] = [
    { 
      id: '1', 
      name: 'Lumix Prime Mirrorless', 
      description: 'High-end mirrorless camera with 4K recording.', 
      price: 1250, 
      stock: 10, 
      category: 'Electronics', 
      categoryId: 'electronics', 
      sellerId: '2', 
      isApproved: true, 
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800', 
      reviews: [],
      specifications: {
        brand: 'Lumix',
        model: 'GH6-X',
        category: 'Electronics',
        features: ['4K 120fps', 'In-body Stabilization', 'Weather Sealed'],
        dimensions: '138 x 100 x 99 mm',
        additionalInfo: 'Includes 12-60mm Leica lens kit.'
      }
    },
    { 
      id: '2', 
      name: 'Suede Minimalist Sofa', 
      description: 'Bespoke hand-crafted sofa.', 
      price: 890, 
      stock: 5, 
      category: 'Furniture', 
      categoryId: 'furniture', 
      sellerId: '2', 
      isApproved: true, 
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800', 
      reviews: [],
      specifications: {
        brand: 'Sauda Home',
        model: 'Nordic-Suede',
        category: 'Furniture',
        features: ['Premium Suede', 'Solid Oak Frame', 'Ergonomic Support'],
        dimensions: '210 x 95 x 85 cm',
        additionalInfo: 'Available in Forest Green and Midnight Blue.'
      }
    },
    { 
      id: '3', 
      name: 'MacBook Pro M3 Max', 
      description: 'Powerhouse laptop.', 
      price: 3499, 
      stock: 3, 
      category: 'Electronics', 
      categoryId: 'electronics', 
      sellerId: '2', 
      isApproved: false, 
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800', 
      reviews: [],
      specifications: {
        brand: 'Apple',
        model: 'MacBook Pro 16',
        category: 'Electronics',
        features: ['M3 Max Chip', '128GB RAM', 'Liquid Retina XDR'],
        dimensions: '35.57 x 24.81 x 1.68 cm',
        additionalInfo: 'Space Black finish with 4TB SSD.'
      }
    }
  ];

  const orders: any[] = [
    { 
      id: '1', 
      customerId: '3', 
      buyerName: 'Dina Buyer',
      sellerId: '2', 
      status: 'delivered', 
      totalAmount: 1250, 
      paymentMethod: 'stripe', 
      items: [{ id: '1', name: 'Lumix Prime Mirrorless', price: 1250, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800' }], 
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString() 
    },
    { 
      id: '2', 
      customerId: '3', 
      buyerName: 'Dina Buyer',
      sellerId: '2', 
      status: 'pending', 
      totalAmount: 890, 
      paymentMethod: 'paypal', 
      items: [{ id: '2', name: 'Suede Minimalist Sofa', price: 890, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800' }], 
      createdAt: new Date().toISOString() 
    }
  ];

  const wishlists: Record<string, string[]> = {};
  const messages: any[] = [];
  const notifications: any[] = [];

  // [PATTERN] Behavioral: Observer (Global Review Subject)
  const serverReviewSubject = new ReviewSubject();
  const serverRatingAggregator = new RatingAggregator();
  serverReviewSubject.attach(new SellerReviewNotifier());
  serverReviewSubject.attach(new AdminAuditLogger());
  serverReviewSubject.attach(serverRatingAggregator);

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role = 'customer' } = req.body;
    if (role === 'admin') return res.status(403).json({ error: 'Admin registration is restricted to internal protocols' });
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const u = { id: String(users.length + 1), username, email, password: await bcrypt.hash(password, 10), role };
    users.push(u);
    const token = jwt.sign({ id: u.id, role: u.role, email: u.email, username: u.username }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
    res.json({ token, user: { id: u.id, username, email, role } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Auth failure' });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Identity not found in database' });
    res.json({ success: true, message: 'Recovery sequence initialized. Check communication nodes.' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.put('/api/auth/profile', authenticate, async (req: any, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.body.username) user.username = req.body.username;
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });

  // --- CATALOG ---
  app.get('/api/products', (req, res) => res.json(products));
  app.get('/api/products/:id', (req, res) => {
    const p = products.find(prod => prod.id === req.params.id);
    p ? res.json(p) : res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/products/:id/review', authenticate, (req: any, res) => {
    const p = products.find(prod => prod.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });

    // Requirement: only users who purchased the product can leave a review
    const hasPurchased = orders.some(o => 
      o.customerId === req.user.id && 
      o.status === 'delivered' && 
      o.items.some((item: any) => item.id === req.params.id)
    );

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Procurement verification failed: Purchase required for asset verification (review).' });
    }

    const review = { 
      id: String(Date.now()), 
      userId: req.user.id, 
      username: req.user.username || req.user.email.split('@')[0], 
      rating: req.body.rating,
      comment: req.body.comment, 
      createdAt: new Date().toISOString() 
    };

    p.reviews = p.reviews || [];
    p.reviews.push(review);

    // [PATTERN] Behavioral: Observer
    serverReviewSubject.notify({
      productId: p.id,
      rating: req.body.rating,
      comment: req.body.comment,
      customerName: review.username,
      timestamp: review.createdAt
    });

    // Update product rating based on aggregator
    p.rating = serverRatingAggregator.getAverage(p.id);

    res.json(review);
  });

  app.delete('/api/seller/products/:id', authenticate, authorize(['seller']), (req: any, res) => {
    const idx = products.findIndex(prod => prod.id === req.params.id && prod.sellerId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Asset not found or access denied.' });
    products.splice(idx, 1);
    res.json({ success: true });
  });

  // --- ORDERS ---
  app.get('/api/orders', authenticate, (req: any, res) => {
    res.json(orders.filter(o => o.customerId === req.user.id || req.user.role === 'admin'));
  });

  app.get('/api/orders/:id/invoice', authenticate, (req: any, res) => {
    const order = orders.find(o => o.id === req.params.id && (o.customerId === req.user.id || o.sellerId === req.user.id || req.user.role === 'admin'));
    if (!order) return res.status(404).json({ error: 'Invoice not found or access denied' });

    const seller = users.find(u => u.id === order.sellerId);

    res.json({
      invoiceId: `INV-${order.id}-${new Date(order.createdAt).getTime()}`,
      orderId: order.id,
      buyer: { id: order.customerId, name: order.buyerName || 'Valued Customer' },
      seller: { id: order.sellerId, name: seller?.username || 'Merchant Node' },
      items: (order.items || []).map((item: any) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: (item.price || 0) * (item.quantity || 1)
      })),
      subtotal: order.totalAmount,
      total: order.totalAmount,
      currency: 'USD',
      createdAt: order.createdAt,
      status: order.status === 'delivered' ? 'COMPLETED' : 'PROCESSED'
    });
  });

  app.post('/api/orders', authenticate, async (req: any, res) => {
    const { items, totalAmount, paymentMethod } = req.body;
    // Multi-seller logic: simplify to first seller in items for now, or just handle multiple
    const sellerId = items?.[0]?.sellerId || '2';
    // [PATTERN] Behavioral: Strategy (Calculate dynamic price/discounts)
    const engine = new PricingEngine(new StandardPricingStrategy());
    if (totalAmount > 3000) {
      engine.setStrategy(new VIPPricingStrategy());
    } else if (totalAmount > 1000) {
      engine.setStrategy(new BulkOrderPricingStrategy());
    }
    
    const calculation = engine.computeTotal(totalAmount, 1);
    const finalAmount = calculation.total;
    const appliedStrategy = calculation.strategyName;

    const order = {
      id: String(orders.length + 1),
      customerId: req.user.id,
      buyerName: req.user.username || req.user.email.split('@')[0],
      sellerId,
      status: 'pending',
      totalAmount: finalAmount,
      appliedDiscount: appliedStrategy,
      paymentMethod,
      items: (items || []).map((i: any) => ({ ...i, imageUrl: products.find(p => p.id === i.id)?.imageUrl })),
      createdAt: new Date().toISOString()
    };
    orders.push(order);

    // [PATTERN] Behavioral: Observer (Notify stakeholders of new order)
    const orderSubject = new SaudaOrderSubject(order.id, req.user.email, 'pending');
    orderSubject.attach(new EmailNotifier());
    orderSubject.attach(new SMSNotifier());
    orderSubject.attach(new LogNotifier());
    orderSubject.notify();

    // [PATTERN] Structural: Adapter (Process payment via selected gateway)
    try {
      const gateway = getPaymentGateway(paymentMethod || 'stripe');
      const result = await gateway.pay(totalAmount, 'USD');
      console.log(`[PAYMENT ADAPTER] Result:`, result);
    } catch (err) {
      console.error(`[PAYMENT ADAPTER] Integration Error:`, err);
    }

    res.json(order);
  });

  // --- WISHLIST ---
  app.get('/api/wishlist', authenticate, (req: any, res) => res.json(wishlists[req.user.id] || []));
  app.post('/api/wishlist/:pid', authenticate, (req: any, res) => {
    const uid = req.user.id;
    wishlists[uid] = wishlists[uid] || [];
    if (!wishlists[uid].includes(req.params.pid)) wishlists[uid].push(req.params.pid);
    res.json(wishlists[uid]);
  });
  app.delete('/api/wishlist/:pid', authenticate, (req: any, res) => {
    const uid = req.user.id;
    if (wishlists[uid]) wishlists[uid] = wishlists[uid].filter(id => id !== req.params.pid);
    res.json(wishlists[uid] || []);
  });

  // --- SELLER ---
  app.get('/api/seller/dashboard', authenticate, authorize(['seller']), (req: any, res) => {
    const p = products.filter(prod => prod.sellerId === req.user.id);
    const o = orders.filter(ord => ord.sellerId === req.user.id);
    const revenue = o.reduce((sum, ord) => sum + (ord.status === 'delivered' ? ord.totalAmount : 0), 0);
    
    // Revenue History (last 7 days dummy but structured)
    const revenueHistory = [
      { name: 'Mon', revenue: Math.floor(revenue * 0.1) },
      { name: 'Tue', revenue: Math.floor(revenue * 0.15) },
      { name: 'Wed', revenue: Math.floor(revenue * 0.25) },
      { name: 'Thu', revenue: Math.floor(revenue * 0.12) },
      { name: 'Fri', revenue: Math.floor(revenue * 0.18) },
      { name: 'Sat', revenue: Math.floor(revenue * 0.1) },
      { name: 'Sun', revenue: Math.floor(revenue * 0.1) },
    ];

    res.json({ revenue, activeProductsCount: p.length, recentOrdersCount: o.length, products: p, orders: o, revenueHistory });
  });

  app.get('/api/seller/orders', authenticate, authorize(['seller']), (req: any, res) => {
    res.json(orders.filter(ord => ord.sellerId === req.user.id));
  });

  app.patch('/api/seller/orders/:orderId/status', authenticate, authorize(['seller']), (req: any, res) => {
    const { status } = req.body;
    const allowedStatuses = ['processing', 'shipped', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition segment' });
    }

    const order = orders.find(o => o.id === req.params.orderId && o.sellerId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found in seller node' });

    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot modify terminal delivered state' });
    }

    order.status = status;

    // [PATTERN] Behavioral: Observer (Notify of status change)
    const user = users.find(u => u.id === order.customerId);
    if (user) {
      const orderSubject = new SaudaOrderSubject(order.id, user.email, status);
      orderSubject.attach(new EmailNotifier());
      orderSubject.attach(new LogNotifier());
      orderSubject.notify();
    }

    res.json(order);
  });

  app.post('/api/seller/products', authenticate, authorize(['seller']), (req: any, res) => {
    const p = { ...req.body, id: String(products.length + 1), sellerId: req.user.id, isApproved: false, reviews: [] };
    products.push(p);
    res.json(p);
  });

  app.put('/api/seller/products/:id', authenticate, authorize(['seller']), (req: any, res) => {
    const p = products.find(prod => prod.id === req.params.id && prod.sellerId === req.user.id);
    if (!p) return res.status(404).json({ error: 'Product not found or access denied' });
    Object.assign(p, req.body);
    res.json(p);
  });

  app.post('/api/seller/invoices/:orderId', authenticate, authorize(['seller']), (req: any, res) => {
    const { format = 'json' } = req.query;
    const order = orders.find(o => o.id === req.params.orderId && o.sellerId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found or access denied' });

    // [PATTERN] Creational: Factory Method (Generate specific document format)
    try {
      const factory = InvoiceFactory.createInvoice(format as any);
      const documentRaw = factory.generate(order);
      
      const invoiceData = {
        invoiceId: `INV-${order.id}-${Date.now()}`,
        orderId: order.id,
        format,
        content: documentRaw,
        buyer: { id: order.customerId, name: order.buyerName || 'Valued Customer' },
        seller: { id: order.sellerId, name: req.user.username || 'Merchant Node' },
        items: order.items,
        total: order.totalAmount,
        createdAt: new Date().toISOString()
      };

      res.json(invoiceData);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- ADMIN ---
  app.get('/api/admin/dashboard', authenticate, authorize(['admin']), (req, res) => {
    const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);
    
    const revenueHistory = [
      { name: 'Mon', revenue: Math.floor(revenue * 0.2) },
      { name: 'Tue', revenue: Math.floor(revenue * 0.1) },
      { name: 'Wed', revenue: Math.floor(revenue * 0.3) },
      { name: 'Thu', revenue: Math.floor(revenue * 0.05) },
      { name: 'Fri', revenue: Math.floor(revenue * 0.15) },
      { name: 'Sat', revenue: Math.floor(revenue * 0.1) },
      { name: 'Sun', revenue: Math.floor(revenue * 0.1) },
    ];

    res.json({ 
      totalRevenue: revenue, 
      totalUsers: users.length, 
      pendingApprovals: products.filter(p => !p.isApproved).length, 
      allProducts: products, 
      allUsers: users.map(({password, ...u}) => u),
      revenueHistory 
    });
  });

  app.delete('/api/admin/users/:id', authenticate, authorize(['admin']), (req, res) => {
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx !== -1) users.splice(idx, 1);
    res.json({ success: true });
  });

  app.post('/api/admin/products/:id/approve', authenticate, authorize(['admin']), (req, res) => {
    const p = products.find(prod => prod.id === req.params.id);
    if (p) p.isApproved = true;
    res.json({ success: true });
  });

  app.post('/api/admin/products/:id/reject', authenticate, authorize(['admin']), (req, res) => {
    const p = products.find(prod => prod.id === req.params.id);
    if (p) p.isApproved = false; // Or remove it
    res.json({ success: true });
  });

  app.post('/api/admin/broadcast', authenticate, authorize(['admin']), (req: any, res) => {
    const { title, content } = req.body;
    users.forEach(u => notifications.push({ id: String(notifications.length + 1), userId: u.id, title, message: content, read: false, createdAt: new Date().toISOString() }));
    res.json({ success: true });
  });

  // --- MESSAGES ---
  app.get('/api/messages/eligible-contacts', authenticate, (req: any, res) => {
    const uid = req.user.id;
    const role = req.user.role;
    if (role === 'customer') {
      const sids = [...new Set(orders.filter(o => o.customerId === uid).map(o => o.sellerId))];
      return res.json(users.filter(u => sids.includes(u.id)).map(u => ({ id: u.id, username: u.username, role: u.role })));
    }
    if (role === 'seller') {
      const cids = [...new Set(orders.filter(o => o.sellerId === uid).map(o => o.customerId))];
      return res.json(users.filter(u => cids.includes(u.id)).map(u => ({ id: u.id, username: u.username, role: u.role })));
    }
    res.json([]);
  });

  app.get('/api/messages', authenticate, (req: any, res) => {
    res.json(messages.filter(m => m.fromId === req.user.id || m.toId === req.user.id));
  });

  app.post('/api/messages', authenticate, (req: any, res) => {
    const { toId, text } = req.body;
    const hasTransHistory = orders.some(o => (o.customerId === req.user.id && o.sellerId === toId) || (o.customerId === toId && o.sellerId === req.user.id));
    if (!hasTransHistory && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Communication restricted. Purchase required.' });
    }
    const m = { id: String(messages.length + 1), fromId: req.user.id, toId, text, createdAt: new Date().toISOString() };
    messages.push(m);
    res.json(m);
  });

  // --- NOTIFICATIONS ---
  app.get('/api/notifications', authenticate, (req: any, res) => res.json(notifications.filter(n => n.userId === req.user.id)));
  app.put('/api/notifications/:id/read', authenticate, (req, res) => {
    const n = notifications.find(notif => notif.id === req.params.id);
    if (n) n.read = true;
    res.json({ success: true });
  });

  // --- SEARCH ---
  app.get('/api/search', (req, res) => {
    const q = (req.query.q as string || '').toLowerCase();
    if (!q) return res.json({ products: [], users: [] });

    const matchedProducts = products.filter(p => 
      p.isApproved && (
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      )
    );

    const matchedUsers = users.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.role.toLowerCase().includes(q)
    ).map(({ password, ...u }) => u);

    res.json({
      products: matchedProducts,
      users: matchedUsers,
      // Add other entities if applicable (protocols, etc.)
      protocols: [] 
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

startServer();
