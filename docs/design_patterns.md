# Software Design Patterns: Architectural Justification
## Sauda Digital Commerce Infrastructure (Enterprise SDK)

This document provides academic and technical justification for the design patterns implemented in Sauda, ensuring adherence to SOLID principles and enterprise scalability.

---

### 1. Creational Pattern: Factory Method
**Implementation**: `InvoiceFactory` (server.ts), `ProductFactory` (api.ts)
**Justification**: Encapsulates object creation. Instead of the UI knowing how to build an 'Electronic' or 'Physical' product, it calls `ProductFactory.create()`.
- **SOLID**: Satisfies **Open/Closed Principle (OCP)**. New product types or invoice formats can be added without modifying existing factory consumers.
- **Problem Solved**: High coupling between UI components and concrete implementation classes.

### 2. Creational Pattern: Singleton Pattern
**Implementation**: `CartStore` (src/server/patterns/creational/cart_singleton.ts)
**Justification**: Ensures a single source of truth for the cart state across the entire application (Header, Catalog, Checkout).
- **SOLID**: Adheres to **Single Responsibility Principle (SRP)** by centralizing state management.
- **Problem Solved**: Desynchronized cart counts and state management overhead across disconnected components.

### 3. Structural Pattern: Adapter Pattern
**Implementation**: `PaymentGateway` (Stripe/PayPal Adapters), `CurrencyAdapter` (USD/KZT/EUR)
**Justification**: Standardizes incompatible interfaces. The application uses a unified `CurrencyAdapter` interface regardless of the specific currency being rendered.
- **SOLID**: Satisfies **Liskov Substitution Principle (LSP)**. Any currency adapter can be swapped at runtime without the UI breaking.
- **Problem Solved**: Integration complexity when dealing with multiple currencies and payment providers with different API signatures.

### 4. Structural Pattern: Decorator Pattern
**Implementation**: `ProductDecorator` (NewArrival, Sale, Trending, OutOfStock)
**Justification**: Attaches additional responsibilities (badges, dynamic pricing) to objects dynamically without subclassing.
- **SOLID**: Adheres to **OCP**. We add "Sale" logic or "New" badges without changing the base `Product` class.
- **Problem Solved**: Class explosion. without decorators, we would need `SaleProduct`, `NewArrivalProduct`, `TrendingSaleProduct`, etc.

### 5. Behavioral Pattern: Strategy Pattern
**Implementation**: `PricingStrategy` (Standard, VIP, Bulk, Seasonal)
**Justification**: Defines a family of algorithms (pricing logic), encapsulates each one, and makes them interchangeable at runtime.
- **SOLID**: Adheres to **Interface Segregation Principle (ISP)**. The pricing interface is lean and specific to calculation.
- **Problem Solved**: Nested `if-else` blocks for promo codes and discounts that are difficult to test and maintain.

### 6. Behavioral Pattern: Observer Pattern
**Implementation**: `OrderObserver` (Email, SMS, Log), `ReviewObserver` (SellerNotify, AdminAudit)
**Justification**: Defines a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.
- **SOLID**: Adheres to **SRP**. The `OrderSubject` doesn't need to know how emails or SMS work; it just broadcasts the signal.
- **Problem Solved**: Tight coupling between business logic and side effects (notifications, logging).

### 7. Behavioral Pattern: Command Pattern
**Implementation**: `CartCommand` (AddToCart, RemoveFromCart, UpdateQuantity)
**Justification**: Encapsulates a request as an object, thereby letting you parameterize clients with different requests and support undoable operations.
- **SOLID**: Adheres to **DIP**. High-level UI depends on the Command interface, not the low-level logic of array manipulation.
- **Problem Solved**: Difficulty in implementing "Undo" features and tracking user action history.

---

## SOLID Principles Implementation Matrix

| Principle | Pattern/Technique | Implementation Example |
| :--- | :--- | :--- |
| **S**RP | Observer | `OrderSubject` only manages order state; `EmailNotifier` only handles SMTP. |
| **O**CP | Decorator | Adding a "Limited Edition" badge via a new Decorator without touching `Product`. |
| **L**SP | Adapter | `Checkout` component works identically with `StripeAdapter` or `PayPalAdapter`. |
| **I**SP | Strategy | `PricingStrategy` interface contains only `calculate()` and `getDiscount()`. |
| **D**IP | Factory | UI depends on the `Product` interface, while `ProductFactory` provides the detail. |

---

## Conclusion
Sauda utilizes these patterns to transform a basic e-commerce site into a modular infrastructure. Each pattern was chosen to solve specific scalability bottlenecks identified during the design phase.
