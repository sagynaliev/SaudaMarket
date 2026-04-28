import { CartStore } from '../creational/cart_singleton';

/**
 * COMMAND PATTERN: CART OPERATIONS
 * 
 * Decouples the request for an operation from the object that performs it.
 * Enables Undo/Redo functionality and logging.
 */

// [DIP] Interface for all commands
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// [SRP] Command for adding to cart
export class AddToCartCommand implements Command {
  public description: string;
  private cartStore = CartStore.getInstance();

  constructor(private item: any) {
    this.description = `Added item ${item.name || item.id} to cart`;
  }

  execute(): void {
    this.cartStore.addItem({ ...this.item, quantity: 1 });
  }

  undo(): void {
    this.cartStore.removeItem(this.item.id);
  }
}

// Command History / Invoker
export class CommandHistory {
  private history: Command[] = [];
  private undoneHistory: Command[] = [];

  execute(command: Command) {
    // CRITICAL: Ensure execute is called
    command.execute();
    this.history.push(command);
    this.undoneHistory = []; // Clear redo stack on new action
  }

  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
      this.undoneHistory.push(command);
      return command;
    }
    return null;
  }

  redo() {
    const command = this.undoneHistory.pop();
    if (command) {
      command.execute();
      this.history.push(command);
      return command;
    }
    return null;
  }

  getHistory(): string[] {
    return this.history.map(c => c.description);
  }
}
