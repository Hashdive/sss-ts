// pluginFactory.ts

// Define an interface for the transaction object
export interface Transaction {
    from: string;
    to: string;
    amount: number;
}

// Define a class for the plugin
export class Plugin {
    name: string;
    balance: number;  // Initialize balance to 0 for simplicity
    transactions: Transaction[];  // Store transaction history

    constructor(name: string) {
        this.name = name;
        this.balance = 0;
        this.transactions = [];
    }

    // Method to simulate sending a transaction
    sendTransaction(transaction: Transaction): boolean {
        if (this.balance >= transaction.amount) {
            this.balance -= transaction.amount;  // Deduct the amount from sender's balance
            this.transactions.push(transaction);  // Log the transaction
            return true;
        }
        return false;  // Transaction fails if insufficient balance
    }

    // Method to simulate receiving a transaction
    receiveTransaction(transaction: Transaction): void {
        if (transaction.to === this.name) {
            this.balance += transaction.amount;  // Add the amount to recipient's balance
            this.transactions.push(transaction);  // Log the transaction
        }
    }

    // Getter for balance (to assist in testing)
    getBalance(): number {
        return this.balance;
    }

    // Method to view transactions (to assist in testing)
    getTransactions(): Transaction[] {
        return this.transactions;
    }
}

// Factory function to create new plugin instances
export function createPlugin(name: string): Plugin {
    return new Plugin(name);
}
