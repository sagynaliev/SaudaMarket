/**
 * DECORATOR PATTERN: PRODUCT ENHANCEMENTS
 * 
 * Allows behavior to be added to an individual object, either statically or dynamically,
 * without affecting the behavior of other objects from the same class.
 */

export interface ProductComponent {
  getName(): string;
  getPrice(): number;
  getBadges(): string[];
}

export class BaseProduct implements ProductComponent {
  constructor(private name: string, private price: number) {}
  getName(): string { return this.name; }
  getPrice(): number { return this.price; }
  getBadges(): string[] { return []; }
}

// [SRP] Base decorator
abstract class ProductDecorator implements ProductComponent {
  constructor(protected component: ProductComponent) {}
  getName(): string { return this.component.getName(); }
  getPrice(): number { return this.component.getPrice(); }
  getBadges(): string[] { return this.component.getBadges(); }
}

export class NewArrivalDecorator extends ProductDecorator {
  getBadges(): string[] {
    return [...super.getBadges(), "🆕 NEW"];
  }
}

export class SaleDecorator extends ProductDecorator {
  constructor(component: ProductComponent, private discountPercent: number = 10) {
    super(component);
  }
  getPrice(): number {
    return super.getPrice() * (1 - this.discountPercent / 100);
  }
  getBadges(): string[] {
    return [...super.getBadges(), "🔥 SALE"];
  }
}

export class TrendingDecorator extends ProductDecorator {
  getBadges(): string[] {
    return [...super.getBadges(), "📈 TRENDING"];
  }
}

export class OutOfStockDecorator extends ProductDecorator {
  getBadges(): string[] {
    return [...super.getBadges(), "❌ OUT OF STOCK"];
  }
}
