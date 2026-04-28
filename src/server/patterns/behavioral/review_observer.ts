/**
 * OBSERVER PATTERN: PRODUCT REVIEWS
 * 
 * Notifies multiple systems when a new review is submitted.
 */

export interface ReviewData {
  productId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  customerName: string;
  timestamp: string;
}

export interface ReviewObserver {
  onReview(data: ReviewData): void;
}

// [SRP] Notifies the seller of new feedback
export class SellerReviewNotifier implements ReviewObserver {
  onReview(data: ReviewData): void {
    console.log(`[SELLER NOTIFY] New ${data.rating}★ review for product ${data.productId}`);
    // Real logic would push a notification to the seller's dashboard
  }
}

// [SRP] Logs review for compliance and quality control
export class AdminAuditLogger implements ReviewObserver {
  onReview(data: ReviewData): void {
    console.log(`[ADMIN AUDIT] Review logged at ${data.timestamp} by ${data.customerName}`);
  }
}

// [SRP] Updates the product's running average rating
export class RatingAggregator implements ReviewObserver {
  private ratings: Record<string, { total: number, count: number }> = {};

  onReview(data: ReviewData): void {
    if (!this.ratings[data.productId]) {
      this.ratings[data.productId] = { total: 0, count: 0 };
    }
    this.ratings[data.productId].total += data.rating;
    this.ratings[data.productId].count += 1;
    
    const avg = this.ratings[data.productId].total / this.ratings[data.productId].count;
    console.log(`[AGGREGATOR] Product ${data.productId} new average: ${avg.toFixed(1)}★`);
  }

  getAverage(productId: string): number {
    return this.ratings[productId] ? this.ratings[productId].total / this.ratings[productId].count : 0;
  }
}

export class ReviewSubject {
  private observers: ReviewObserver[] = [];

  attach(observer: ReviewObserver): void {
    this.observers.push(observer);
  }

  detach(observer: ReviewObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(data: ReviewData): void {
    this.observers.forEach(o => o.onReview(data));
  }
}
