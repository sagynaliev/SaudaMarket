
/**
 * Product Factory Implementation
 * Category: Creational Pattern
 */

export interface ProductDisplay {
  id: string;
  name: string;
  price: number;
  getType(): string;
  getFormattedDetails(): string;
}

class PhysicalProduct implements ProductDisplay {
  constructor(public id: string, public name: string, public price: number, public weight: number) {}
  
  getType() { return 'Physical Item'; }
  
  getFormattedDetails() {
    return `${this.name} (${this.weight}kg) - $${this.price}`;
  }
}

class DigitalProduct implements ProductDisplay {
  constructor(public id: string, public name: string, public price: number, public fileSize: string) {}
  
  getType() { return 'Digital Download'; }
  
  getFormattedDetails() {
    return `${this.name} [Size: ${this.fileSize}] - $${this.price}`;
  }
}

export class ProductFactory {
  static createProduct(data: any): ProductDisplay {
    // Logic to decide which type of product to create
    if (data.isDigital || data.category === 'Software' || data.category === 'Digital') {
      return new DigitalProduct(data.id, data.name, data.price, data.fileSize || 'Unknown');
    }
    
    return new PhysicalProduct(data.id, data.name, data.price, data.weight || 0);
  }
}
