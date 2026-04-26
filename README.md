# Sauda E-Commerce Engine

## 1. PROJECT CHARTER
- **Project Name**: Sauda E-Commerce Engine
- **Goal**: Enterprise-grade e-commerce backend with design patterns
- **MVP Features**: authentication, product catalog, cart, orders, invoices, payment gateway integration
- **Constraints**: SQLite database (In-memory mock for demo), JWT auth
- **Team**: Alihan (1 developer)
- **Deadline**: April 30

## 2. RISK MANAGEMENT TABLE
| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | Scope creep | High | High | Strict MVP, no extras |
| 2 | Technical debt | Medium | High | SOLID principles enforced |
| 3 | Security vulnerabilities | Low | High | JWT, input validation |

## 3. WORK BREAKDOWN STRUCTURE
- **Phase 1**: Project Setup (Node.js/Express + JWT)
- **Phase 2**: Design Patterns Implementation (Invoice Factory, Payment Adapter, Order Observer)
- **Phase 3**: Role-based API (Admin/Seller/Customer endpoints)
- **Phase 4**: Testing + Docs

## 4. DESIGN PATTERNS JUSTIFICATION
Implemented in `/src/server/patterns/`:
- **Creational (Factory Method)**: Used for `Invoice` generation (PDF, HTML, JSON). Decouples creation logic from usage.
- **Structural (Adapter)**: Used for `PaymentGateway`. Standardizes Stripe and PayPal APIs into a single interface.
## 5. LOCAL SETUP (Running on your Laptop)

To run this project locally, follow these steps:

1. **Prerequisites**: Ensure you have Node.js (v18+) installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**: Create a `.env` file in the root based on `.env.example`:
   ```bash
   JWT_SECRET=your_super_secret_key
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```
5. **Access the App**: Open your browser at `http://localhost:3000`.

### Default Credentials:
- **Admin**: `admin@sauda.io` / `admin123`
- **Seller**: `seller@sauda.io` / `seller123`
- **Customer**: `user@sauda.io` / `user123`

