import { Product } from '../../../types';

export interface PriceObserver {
  onPriceChange(product: Product, oldPrice: number): void;
}

export class WishlistSubject {
  private observers: PriceObserver[] = [];
  private wishlistItems: Map<string, number> = new Map(); // id -> price

  attach(observer: PriceObserver) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: PriceObserver) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  // Monitor products and check against current prices
  sync(products: Product[]) {
    products.forEach(p => {
      const oldPrice = this.wishlistItems.get(p.id);
      if (oldPrice !== undefined && oldPrice !== p.price) {
        this.notify(p, oldPrice);
        this.wishlistItems.set(p.id, p.price);
      }
    });
  }

  // Update tracking for wishlist items
  setWishlist(ids: string[], products: Product[]) {
    this.wishlistItems.clear();
    ids.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        this.wishlistItems.set(id, product.price);
      }
    });
  }

  private notify(product: Product, oldPrice: number) {
    this.observers.forEach(o => o.onPriceChange(product, oldPrice));
  }
}

export class WishlistPriceNotifier implements PriceObserver {
  constructor(private onToast: (msg: string, type: any) => void) {}

  onPriceChange(product: Product, oldPrice: number) {
    const change = product.price < oldPrice ? 'decreased' : 'increased';
    const accent = product.price < oldPrice ? 'Price Drop!' : 'Alert:';
    this.onToast(`${accent} ${product.name} has ${change} to $${product.price.toFixed(2)}`, product.price < oldPrice ? 'success' : 'info');
  }
}
