import { createHash, randomUUID, createVerify } from 'crypto';

export interface ITransaction {
    getId(): string;
    getFrom(): string;
    getTo(): string;
    getAmount(): number;
    getSignature(): string;
    serialize(): string;
    getHash(): string;  // Method to compute hash of the transaction
    validate(publicKey: string): boolean;
}

export class Transaction implements ITransaction {
    private id: string;
    private from: string;
    private to: string;
    private amount: number;
    private signature: string;

    constructor(from: string, to: string, amount: number, signature: string) {
        this.id = randomUUID();  // Generates a unique identifier for the transaction
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.signature = signature;
    }

    getId(): string {
        return this.id;
    }

    getFrom(): string {
        return this.from;
    }

    getTo(): string {
        return this.to;
    }

    getAmount(): number {
        return this.amount;
    }

    getSignature(): string {
        return this.signature;
    }

    serialize(): string {
        return JSON.stringify({
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount
        });
    }

    // Calculate the SHA-256 hash of the transaction's serialized form
    getHash(): string {
        const hash = createHash('sha256');
        hash.update(this.serialize());
        return hash.digest('hex');
    }

    validate(publicKey: string): boolean {
        if (!this.from || !this.to || !this.amount || !this.signature) return false;
        return verifySignature(this.serialize(), this.signature, publicKey);
    }
}

function verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verifier = createVerify('SHA256');
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
}
