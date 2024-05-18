import crypto from 'crypto';

export interface IGlobalMerkleNode {
    hash: string;
    leftChild: IGlobalMerkleNode | null;
    rightChild: IGlobalMerkleNode | null;
    parent: IGlobalMerkleNode | null;

    setLeftChild(node: IGlobalMerkleNode): void;
    setRightChild(node: IGlobalMerkleNode): void;
    getParent(): IGlobalMerkleNode | null;
}

export interface IGlobalMerkleTree {
    root: IGlobalMerkleNode | null;
    localRoots: Map<string, IGlobalMerkleNode>;  // Maps local root hashes to their corresponding nodes

    addLocalRoot(localRootHash: string): void;
    recalculateTree(): void;
    verifyLocalRootInGlobalTree(localRootHash: string): boolean;
    getRootHash(): string | null;
}

class GlobalMerkleNode implements IGlobalMerkleNode {
    constructor(
        public hash: string,
        public leftChild: IGlobalMerkleNode | null = null,
        public rightChild: IGlobalMerkleNode | null = null,
        public parent: IGlobalMerkleNode | null = null
    ) {}

    setLeftChild(node: IGlobalMerkleNode): void {
        this.leftChild = node;
        node.parent = this;
    }

    setRightChild(node: IGlobalMerkleNode): void {
        this.rightChild = node;
        node.parent = this;
    }

    getParent(): IGlobalMerkleNode | null {
        return this.parent;
    }
}

export class GlobalMerkleTree implements IGlobalMerkleTree {
    public root: IGlobalMerkleNode | null = null;
    public localRoots: Map<string, IGlobalMerkleNode> = new Map();

    addLocalRoot(localRootHash: string): void {
        const newNode = new GlobalMerkleNode(localRootHash);
        this.localRoots.set(localRootHash, newNode);
        this.recalculateTree();
    }

    recalculateTree(): void {
        let leaves = Array.from(this.localRoots.values());
        if (leaves.length === 1) {
            console.log('setting root ...');
            this.root = leaves[0]; // Directly set root if only one node exists
            console.log('root', this.root)
            return;
        }
        while (leaves.length > 1) {
            const newLevel = [];
            for (let i = 0; i < leaves.length; i += 2) {
                if (i + 1 < leaves.length) {
                    const parentNode = new GlobalMerkleNode(
                        this.calculateHash(leaves[i].hash + leaves[i + 1].hash)
                    );
                    parentNode.setLeftChild(leaves[i]);
                    parentNode.setRightChild(leaves[i + 1]);
                    newLevel.push(parentNode);
                    console.log('new level pushed:', parentNode);
                } else {
                    newLevel.push(leaves[i]); // Odd node at the end stays at the same level
                }
            }
            leaves = newLevel; // Move up one level
        }
        this.root = leaves[0];
    }

    verifyLocalRootInGlobalTree(localRootHash: string): boolean {
        let node = this.localRoots.get(localRootHash);
        if (!node) {
            return false;
        }
        while (node?.parent) {
            const parent: any = node.parent;
            const calculatedHash = this.calculateHash(
                (parent.leftChild ? parent.leftChild.hash : '') +
                (parent.rightChild ? parent.rightChild.hash : '')
            );
            if (parent.hash !== calculatedHash) {
                return false;
            }
            node = parent;
        }
        return node === this.root;
    }

    getRootHash(): string | null {
        return this.root ? this.root.hash : null;
    }

    private calculateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
