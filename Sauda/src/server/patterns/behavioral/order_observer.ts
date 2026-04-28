export interface OrderData {
  id: string;
  status: string;
  customerEmail: string;
}

export interface OrderObserver {
  update(orderData: OrderData): void;
}

export class EmailNotifier implements OrderObserver {
  update(orderData: OrderData): void {
    console.log(`[EMAIL NOTIFIER] To: ${orderData.customerEmail} | Subject: Sauda Order #${orderData.id} Update | Body: Your order is now ${orderData.status.toUpperCase()}`);
  }
}

export class SMSNotifier implements OrderObserver {
  update(orderData: OrderData): void {
    console.log(`[SMS NOTIFIER] Sauda: Order #${orderData.id} status changed to ${orderData.status}`);
  }
}

export class LogNotifier implements OrderObserver {
  update(orderData: OrderData): void {
    console.log(`[LOG NOTIFIER] ${new Date().toISOString()} | ORDER_UPDATE | ID: ${orderData.id} | STATUS: ${orderData.status}`);
  }
}

export class SaudaOrderSubject {
  private observers: OrderObserver[] = [];
  constructor(private orderId: string, private customerEmail: string, private status: string = 'pending') {}

  attach(observer: OrderObserver): void {
    this.observers.push(observer);
  }

  detach(observer: OrderObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(): void {
    const data: OrderData = { id: this.orderId, status: this.status, customerEmail: this.customerEmail };
    this.observers.forEach(obs => obs.update(data));
  }

  setStatus(newStatus: string): void {
    this.status = newStatus;
    this.notify();
  }
}
