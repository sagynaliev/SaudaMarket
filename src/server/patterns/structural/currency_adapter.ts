/**
 * ADAPTER PATTERN: CURRENCY CONVERTER
 * 
 * Standardizes access to multiple currency systems.
 */

// Interface defining what a converter should do
export interface CurrencyConverter {
  convert(amount: number): number;
  getSymbol(): string;
  getLabel(): string;
}

// [SRP] KZT Adapter
export class KZTAdapter implements CurrencyConverter {
  convert(amountInUSD: number): number {
    return amountInUSD * 470; // 1 USD = 470 KZT
  }
  getSymbol(): string { return '₸'; }
  getLabel(): string { return 'KZT'; }
}

// [SRP] USD Adapter (Base)
export class USDAdapter implements CurrencyConverter {
  convert(amountInUSD: number): number {
    return amountInUSD;
  }
  getSymbol(): string { return '$'; }
  getLabel(): string { return 'USD'; }
}

// [SRP] EUR Adapter
export class EURAdapter implements CurrencyConverter {
  convert(amountInUSD: number): number {
    return amountInUSD * 0.92; // 1 USD = 0.92 EUR (approx)
  }
  getSymbol(): string { return '€'; }
  getLabel(): string { return 'EUR'; }
}

/**
 * Adapter Factory
 */
export class CurrencyAdapterFactory {
  static getAdapter(currency: 'KZT' | 'USD' | 'EUR'): CurrencyConverter {
    switch (currency) {
      case 'KZT': return new KZTAdapter();
      case 'EUR': return new EURAdapter();
      default: return new USDAdapter();
    }
  }
}
