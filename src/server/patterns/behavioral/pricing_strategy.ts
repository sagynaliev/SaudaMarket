/**
 * STRATEGY PATTERN: PRICING ENGINE
 * 
 * WHY Strategy over if/else:
 * Using many if/else blocks for pricing (VIP, Bulk, Seasonal) leads to "Fragile Code".
 * Every time a new marketing promotion is added, we risk breaking existing logic.
 * The Strategy pattern allows us to swap algorithms at runtime and keeps each logic
 * encapsulated in its own class, adhering to SRP and OCP.
 */

// [DIP] Depend on abstractions, not concretions
export interface PricingStrategy {
  name: string;
  description: string;
  calculate(basePrice: number, quantity: number): number;
  getDiscountPercent(): number;
}

// [SRP] Each strategy has one reason to change: its specific discount logic
export class StandardPricingStrategy implements PricingStrategy {
  name = 'Standard';
  description = 'Default market pricing';
  calculate(basePrice: number, quantity: number): number {
    return basePrice * quantity;
  }
  getDiscountPercent(): number { return 0; }
}

export class VIPPricingStrategy implements PricingStrategy {
  name = 'VIP Exclusive';
  description = 'Special 15% discount for verified VIP members';
  calculate(basePrice: number, quantity: number): number {
    return (basePrice * quantity) * 0.85;
  }
  getDiscountPercent(): number { return 15; }
}

export class BulkOrderPricingStrategy implements PricingStrategy {
  name = 'Bulk Discount';
  description = '10% discount applied for orders of 10 units or more';
  calculate(basePrice: number, quantity: number): number {
    const total = basePrice * quantity;
    return quantity >= 10 ? total * 0.90 : total;
  }
  getDiscountPercent(): number { return 10; }
}

export class SeasonalSalePricingStrategy implements PricingStrategy {
  name = 'Seasonal Sale';
  description = 'Flash sale discount: 25% OFF all items';
  calculate(basePrice: number, quantity: number): number {
    return (basePrice * quantity) * 0.75;
  }
  getDiscountPercent(): number { return 25; }
}

/**
 * Helper to resolve strategy based on context
 * Demonstrates [LSP]: All strategies are interchangeable within the engine
 */
export function resolvePricingStrategy(promoCode?: string, quantity: number = 1): PricingStrategy {
  if (promoCode === 'VIP15') return new VIPPricingStrategy();
  if (promoCode === 'SALE25') return new SeasonalSalePricingStrategy();
  if (promoCode === 'BULK10' || quantity >= 10) return new BulkOrderPricingStrategy();
  return new StandardPricingStrategy();
}

// [OCP] PricingEngine is open for extension via new strategies, closed for modification
export class PricingEngine {
  private strategy: PricingStrategy;

  constructor(strategy: PricingStrategy = new StandardPricingStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy: PricingStrategy) {
    this.strategy = strategy;
  }

  computeTotal(basePrice: number, quantity: number) {
    const totalWithoutDiscount = basePrice * quantity;
    const finalTotal = this.strategy.calculate(basePrice, quantity);
    const savings = totalWithoutDiscount - finalTotal;

    return {
      total: finalTotal,
      savings,
      strategyName: this.strategy.name,
      discountPercent: this.strategy.getDiscountPercent()
    };
  }
}
