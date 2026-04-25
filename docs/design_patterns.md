# Design Pattern Justification

In the Sauda project, we implemented three distinct categories of patterns to ensure scalability and maintainability.

## 1. Creational Patterns: Factory Method
- **Requirement**: Abstracting object creation.
- **Implementation**: We used a **Service Factory** to initialize API services (Products, Orders, Auth) without tying the UI components to specific Axios or Fetch implementations.
- **Justification**: This allows us to swap the real Firebase/Mock API with a local development server by changing just one configuration line in the Factory.

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
