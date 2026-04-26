export interface PaymentResult {
  provider: string;
  status: 'charged' | 'paid' | 'reversed' | 'cancelled';
  amount?: number;
  orderId?: string;
}

export interface PaymentGateway {
  pay(amount: number, currency: string): Promise<PaymentResult>;
  refund(orderId: string): Promise<PaymentResult>;
}

export class StripeAPI {
  async charge(amount: number, currency: string): Promise<any> {
    console.log(`[EXTERNAL] Stripe charging ${amount} ${currency}`);
    return { provider: 'stripe', status: 'charged', amount };
  }
  async reverse(orderId: string): Promise<any> {
    console.log(`[EXTERNAL] Stripe refunding order ${orderId}`);
    return { provider: 'stripe', status: 'reversed', orderId };
  }
}

export class PayPalAPI {
  async sendPayment(amount: number, currency: string): Promise<any> {
    console.log(`[EXTERNAL] PayPal sending ${amount} ${currency}`);
    return { provider: 'paypal', status: 'paid', amount };
  }
  async cancelPayment(orderId: string): Promise<any> {
    console.log(`[EXTERNAL] PayPal cancelling order ${orderId}`);
    return { provider: 'paypal', status: 'cancelled', orderId };
  }
}

export class StripeAdapter implements PaymentGateway {
  private stripe = new StripeAPI();
  async pay(amount: number, currency: string): Promise<PaymentResult> {
    return await this.stripe.charge(amount, currency);
  }
  async refund(orderId: string): Promise<PaymentResult> {
    return await this.stripe.reverse(orderId);
  }
}

export class PayPalAdapter implements PaymentGateway {
  private paypal = new PayPalAPI();
  async pay(amount: number, currency: string): Promise<PaymentResult> {
    return await this.paypal.sendPayment(amount, currency);
  }
  async refund(orderId: string): Promise<PaymentResult> {
    return await this.paypal.cancelPayment(orderId);
  }
}

export function getPaymentGateway(provider: string): PaymentGateway {
  if (provider === 'stripe') return new StripeAdapter();
  if (provider === 'paypal') return new PayPalAdapter();
  throw new Error(`Unknown provider: ${provider}`);
}
