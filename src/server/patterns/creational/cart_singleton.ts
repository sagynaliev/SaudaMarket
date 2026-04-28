/**
 * SINGLETON PATTERN: CART STORE
 * 
 * Ensures a class has only one instance and provides a global point of access to it.
 */

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sellerId?: string;
};

export class CartStore {
  private static instance: CartStore;
  private items: CartItem[] = [];
  private listeners: (() => void)[] = [];
  private constructor() {}

  public static getInstance(): CartStore {
    if (!CartStore.instance) {
      CartStore.instance = new CartStore();
    }
    return CartStore.instance;
  }

  public addItem(item: CartItem) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
    this.notify();
  }

  public removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.notify();
  }

  public updateQuantity(id: string, quantity: number) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) this.removeItem(id);
    }
    this.notify();
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  public getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public clear() {
    this.items = [];
    this.notify();
  }

  // Basic observer implementation for UI reactivity
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}
