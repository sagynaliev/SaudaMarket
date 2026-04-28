import { Order } from '../../models/types';

export abstract class Invoice {
  abstract generate(order: Order): string;
}

export class PDFInvoice extends Invoice {
  generate(order: Order): string {
    return `[PDF] Sauda Invoice #${order.id} | Total: ${order.totalAmount} KZT | Created: ${new Date().toLocaleDateString()}`;
  }
}

export class HTMLInvoice extends Invoice {
  generate(order: Order): string {
    return `
      <html>
        <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1)">
            <h1 style="color: #6366f1">Sauda Invoice</h1>
            <hr />
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            <p><strong>Total Amount:</strong> ${order.totalAmount} KZT</p>
            <p style="color: #666; font-size: 12px; margin-top: 40px;">Generated at ${new Date().toISOString()}</p>
          </div>
        </body>
      </html>
    `;
  }
}

export class JSONInvoice extends Invoice {
  generate(order: Order): string {
    return JSON.stringify({
      invoice: {
        store: "Sauda",
        order_id: order.id,
        total: order.totalAmount,
        currency: "KZT",
        generated_at: new Date().toISOString()
      }
    }, null, 2);
  }
}

export class InvoiceFactory {
  static createInvoice(formatType: 'pdf' | 'html' | 'json'): Invoice {
    switch (formatType) {
      case 'pdf': return new PDFInvoice();
      case 'html': return new HTMLInvoice();
      case 'json': return new JSONInvoice();
      default: throw new Error(`Unsupported format: ${formatType}`);
    }
  }
}
