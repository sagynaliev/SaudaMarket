/**
 * STRATEGY PATTERN: SEARCH SYSTEM
 */

export interface SearchResult {
  products: any[];
  users: any[];
  protocols?: any[];
}

export interface SearchStrategy {
  search(query: string): Promise<SearchResult>;
}

// Concrete Strategy for Remote API Search
export class RemoteSearchStrategy implements SearchStrategy {
  constructor(private api: any) {}

  async search(query: string): Promise<SearchResult> {
    if (!query || query.length < 2) return { products: [], users: [] };
    try {
      return await this.api.search.global(query);
    } catch (err) {
      console.error("[SEARCH STRATEGY] Remote search failure:", err);
      return { products: [], users: [] };
    }
  }
}

// Concrete Strategy for Local/Mock Search (could be used for offline mode)
export class LocalSearchStrategy implements SearchStrategy {
  constructor(private products: any[], private users: any[]) {}

  async search(query: string): Promise<SearchResult> {
    const q = query.toLowerCase();
    return {
      products: this.products.filter(p => p.name.toLowerCase().includes(q)),
      users: this.users.filter(u => u.username.toLowerCase().includes(q))
    };
  }
}

export class SearchContext {
  private strategy: SearchStrategy;

  constructor(strategy: SearchStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SearchStrategy) {
    this.strategy = strategy;
  }

  async executeSearch(query: string): Promise<SearchResult> {
    return this.strategy.search(query);
  }
}
