# Design Pattern Justification

In the Sauda project, we implemented three distinct categories of patterns to ensure scalability and maintainability.

## 1. Creational Patterns: Factory Method
- **Requirement**: Handling object creation for different product types.
- **Implementation**: We implemented a **ProductFactory** that generates either `PhysicalProduct` or `DigitalProduct` objects based on the category or metadata.
- **Justification**: This centralizes product creation logic. If we decide to add a "Service" or "Subscription" product type later, we only need to update the factory, not the entire UI.

## 2. Structural Patterns: Adapter Pattern
- **Requirement**: Managing how classes compose.
- **Implementation**: The **AuthAdapter** wraps the authentication logic. Whether we use Firebase, Auth0, or a custom JWT server, the application's `Auth` component speaks the same interface.
- **Justification**: It prevents the "vendor lock-in" and makes the authentication logic reusable across different environments.

## 3. Behavioral Patterns: Observer Pattern
- **Requirement**: Managing communication and state flow.
- **Implementation**: React's **Context API** (Internal Observer) for handling Global State (Auth status, Notifications).
- **Justification**: When a user logs in, all registered components (Navbar, Protected Routes) are instantly notified of the state change without complex prop drilling.

## 4. SOLID Principles Compliance
- **Single Responsibility**: Each component (Auth, SellerPanel, etc.) handles one specific logic block.
- **Open/Closed**: New sections (like "Logistics") can be added without modifying the core `App.tsx` routes significantly.
