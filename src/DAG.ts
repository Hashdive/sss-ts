import { DataStoreClass } from "./storage/DataStore";
import StorableObject, { IStorableObject } from "./storage/StorableObject";
import { ITransaction } from "./Transaction";
import { IConsensus } from './DAGConsensus';
import { IMerkleTree } from './DAGMerkle';


export interface IDAG extends IStorableObject {
    addTransaction(transaction: ITransaction): void;
    getTransaction(id: string): Promise<ITransaction | undefined>;
    getParents(transaction: ITransaction): Promise<ITransaction[]>;
    getChildren(transaction: ITransaction): Promise<ITransaction[]>;
    isValid(): Promise<boolean>;
    hasNode(node: IDAGNode): Promise<boolean>;
    hasEdge(edge: IDAGEdge): Promise<boolean>;
}

export interface IDAGProof extends IStorableObject {
    getProofNodes(): Promise<IDAGNode[]>;
    getProofEdges(): Promise<IDAGEdge[]>;
    getProofPaths(): Promise<IDAGPath[]>;
    getProofCycles(): Promise<IDAGCycle[]>;
    getProofComponents(): Promise<IDAGComponent[]>;
    getProofProperties(): Promise<IDAGProperty[]>;
    getProofSize(): Promise<number>;
    getProofDepth(): Promise<number>;
    getProofHash(): Promise<string>;
    verifyProof(dag: IDAG): Promise<boolean>;
}

export interface IDAGEdge extends IStorableObject {
    getDirection(): Promise<EdgeDirection>;
    getFromNode(): Promise<IDAGNode>;
    getToNode(): Promise<IDAGNode>;
    getWeight(): Promise<number>;
    verifyEdge(): Promise<boolean>;
}

export interface IDAGNode extends IStorableObject {
    getHash(): Promise<string>;
    getEdges(): Promise<IDAGEdge[]>;
    getDegree(): Promise<number>;
    getDepth(): Promise<number>;
    getHeight(): Promise<number>;
    getRoot(): Promise<IDAGNode>;
    getLeaf(): Promise<IDAGNode>;
    getProof(): Promise<IDAGProof>;
    verifyNode(): Promise<boolean>;
}

enum EdgeDirection {
    Directed = 'directed',
    Undirected = 'undirected',
}

export interface IDAGPath extends IStorableObject {
    getStartNode(): Promise<IDAGNode>;
    getEndNode(): Promise<IDAGNode>;
    getNodes(): Promise<IDAGNode[]>;
    getEdges(): Promise<IDAGEdge[]>;
    getLength(): Promise<number>;
    getWeight(): Promise<number>;
}

export interface IDAGCycle extends IStorableObject {
    getNodes(): Promise<IDAGNode[]>;
    getEdges(): Promise<IDAGEdge[]>;
    getLength(): Promise<number>;
    getWeight(): Promise<number>;
}

export interface IDAGComponent extends IStorableObject {
    getNodes(): Promise<IDAGNode[]>;
    getEdges(): Promise<IDAGEdge[]>;
    getSize(): Promise<number>;
    getWeight(): Promise<number>;
    getType(): Promise<ComponentType>;
}

enum ComponentType {
    StronglyConnected = 'strongly_connected',
    WeaklyConnected = 'weakly_connected',
}

export interface IDAGProperty extends IStorableObject {
    getName(): Promise<string>;
    getValue(): Promise<any>;
}

export class DAG extends StorableObject implements IDAG {
    private transactions: Map<string, ITransaction>;
    private parentChildMap: Map<string, Set<string>>;
    private consensus: IConsensus;
    private mempool: ITransaction[];
    public merkleTree: IMerkleTree;

    constructor(store: DataStoreClass, collectionName: string, consensus: IConsensus, merkleTree: IMerkleTree) {
        super(store, collectionName);
        this.transactions = new Map();
        this.parentChildMap = new Map();
        this.consensus = consensus;
        this.mempool = [];
        this.merkleTree = merkleTree;
    }

    async loadFromDataStore(): Promise<void> {
        const storedTransactions = await this.list();
        for (const transaction of storedTransactions) {
            this.transactions.set(transaction.getId(), transaction as ITransaction);
            this.parentChildMap.set(transaction.getId(), new Set());
        }

        for (const transaction of storedTransactions) {
            const parentIds = await this.getParentIds(transaction.getId());
            for (const parentId of parentIds) {
                await this.addParentChild(parentId, transaction.getId());
            }
        }
    }

    async saveToDataStore(): Promise<void> {
        for (const transaction of this.transactions.values()) {
            await this.put(transaction.getId(), transaction);
        }
    }

    getMempool(): ITransaction[] {
        return this.mempool;
    }

        // Method to add unconfirmed transactions to the mempool
    addToMempool(transaction: ITransaction): void {
        this.mempool.push(transaction);
    }

    async processMempool(): Promise<void> {
        console.log('mempool: ', this.mempool);
        while (this.mempool.length > 0) {
            const transaction = this.mempool[0]; // Get the first transaction in the mempool
            try {
                console.log('processing mempool transaction: ', transaction);
                // Assume genesis transactions are pre-approved and can be added directly
                const isGenesis = await this.isGenesisTransaction(transaction.getId());
                if (isGenesis) {
                    await this.addTransaction(transaction);
                } else {
                    // Validate the transaction
                    const isValid = await this.consensus.validateTransaction(transaction);
                    console.log('valid result: ', isValid);
                    if (isValid) {
                        console.log("it's valid")
                        // If valid, add it to the DAG
                        await this.addTransaction(transaction);
                    } else {
                        console.log('Invalid transaction:', transaction.getId());
                        // Handle invalid transactions (e.g., reject or ignore)
                    }
                }
                // Remove the processed transaction from the mempool
                this.removeFromMempool(transaction);
            } catch (error) {
                console.error('Error processing transaction:', error);
                // Handle errors during transaction processing
                // If an error occurs, the transaction should not be removed from the mempool
                // to retry processing it later
            }
        }
    }
    


    // Method to remove a transaction from the mempool
    removeFromMempool(transaction: ITransaction): void {
        const index = this.mempool.findIndex((tx) => tx.getId() === transaction.getId());
        if (index !== -1) {
            this.mempool.splice(index, 1);
        }
    }

    private async getParentIds(transactionId: string): Promise<string[]> {
        const parentIds: string[] = [];
        for (const [childId, parentIdsSet] of this.parentChildMap.entries()) {
            if (parentIdsSet.has(transactionId)) {
                parentIds.push(childId);
            }
        }
        return parentIds;
    }

    async addParentChild(parentId: string, childId: string): Promise<void> {
        const parentIds = this.parentChildMap.get(childId);
        if (parentIds) {
            if (!parentIds.has(parentId)) {
                parentIds.add(parentId);
                console.log(`Added parent ${parentId} to child ${childId}`);
            } else {
                console.log(`Parent ${parentId} already exists for child ${childId}`);
            }
        } else {
            this.parentChildMap.set(childId, new Set([parentId]));
            console.log(`Created new parent set for child ${childId} with parent ${parentId}`);
        }
    }

    async hasNode(node: IDAGNode): Promise<boolean> {
        const hash = await node.getHash();
        return this.transactions.has(hash);
    }

    async hasEdge(edge: IDAGEdge): Promise<boolean> {
        const fromNode = await edge.getFromNode();
        const toNode = await edge.getToNode();
        return (await this.hasNode(fromNode)) && (await this.hasNode(toNode));
    }

    async addTransaction(transaction: ITransaction): Promise<void> {
        if (this.transactions.has(transaction.getId())) {
            throw new Error("Transaction already exists.");
        }
        await this.put(transaction.getId(), transaction);
        this.transactions.set(transaction.getId(), transaction);
        this.parentChildMap.set(transaction.getId(), new Set());
        this.merkleTree.addTransactionHash(transaction.getId());
    }

    async verifyTransaction(transactionId: string): Promise<boolean> {
        // Verify transaction using the Merkle Tree
        return this.merkleTree.verifyTransactionHash(transactionId);
    }
    

    async getTransaction(id: string): Promise<ITransaction | undefined> {
        return this.transactions.get(id);
    }

    async getParents(transaction: ITransaction): Promise<ITransaction[]> {
        const parentIds = this.parentChildMap.get(transaction.getId());
        if (!parentIds) {
            return [];
        }
        const parentTransactions = await Promise.all(
            Array.from(parentIds).map(async (parentId) => {
                const parentTransaction = await this.get(parentId);
                return parentTransaction as ITransaction;
            })
        );
        return parentTransactions.filter(Boolean) as ITransaction[];
    }

    async getChildren(transaction: ITransaction): Promise<ITransaction[]> {
        const childTransactions: ITransaction[] = [];
        for (const [childId, parentIds] of this.parentChildMap.entries()) {
            if (parentIds.has(transaction.getId())) {
                const childTransaction = await this.get(childId);
                if (childTransaction) {
                    childTransactions.push(childTransaction as ITransaction);
                }
            }
        }
        return childTransactions;
    }

    async isValid(): Promise<boolean> {
        console.log(this.parentChildMap);
        // Check for duplicate transactions
        const transactionIds = Array.from(this.transactions.keys());
        if (new Set(transactionIds).size !== transactionIds.length) {
            console.log('duplicate');
            return false;
        }

        // Orphan check
        for (const transactionId of this.transactions.keys()) {
            const hasParents = (this.parentChildMap.get(transactionId) || new Set()).size > 0;
            const hasChildren = Array.from(this.parentChildMap.values()).some(parents => parents.has(transactionId));
            const isGenesis = await this.isGenesisTransaction(transactionId);

            if (!hasParents && !hasChildren && !isGenesis) {
                console.log('Orphan transaction detected:', transactionId);
                return false;
            }
        }

        // Check for cyclic dependencies
        if (await this.hasCyclicDependency()) {
            console.log('cyclicDependency');
            return false;
        }
        
        return true;
    }

    private async isGenesisTransaction(transactionId: string): Promise<boolean> {
        // Check if the transaction is a genesis transaction (has no parents)
        return !(await this.parentChildMap.has(transactionId));
    }

    private async hasCyclicDependency(): Promise<boolean> {
        const visited: Set<string> = new Set();
        const recursionStack: Set<string> = new Set();
        for (const transactionId of this.transactions.keys()) {
            if (await this.hasCyclicDependencyDFS(transactionId, visited, recursionStack)) {
                return true;
            }
        }
        return false;
    }

    private async hasCyclicDependencyDFS(
        transactionId: string,
        visited: Set<string>,
        recursionStack: Set<string>
    ): Promise<boolean> {
        visited.add(transactionId);
        recursionStack.add(transactionId);

        // Safely retrieve childIds or default to an empty set
        const childIds = this.parentChildMap.get(transactionId) || new Set<string>();

        // Log the current state of the DFS
        console.log(`Visiting: ${transactionId}, Children: ${Array.from(childIds).join(', ')}, Stack: ${Array.from(recursionStack).join(', ')}`);

        if (childIds) {
            for (const childId of childIds) {
                if (!visited.has(childId)) {
                    if (await this.hasCyclicDependencyDFS(childId, visited, recursionStack)) {
                        return true;
                    }
                } else if (recursionStack.has(childId)) {
                    return true;
                }
            }
        }

        recursionStack.delete(transactionId);
        return false;
    }
}