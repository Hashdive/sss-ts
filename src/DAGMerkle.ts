import crypto from 'crypto';
import { IGlobalMerkleTree } from './GlobalMerkle';

export interface IMerkleNode {
    getHash(): string;
    getLeftChild(): IMerkleNode | undefined;
    getRightChild(): IMerkleNode | undefined;
    setLeftChild(node: IMerkleNode): void;
    setRightChild(node: IMerkleNode): void;
    getParent(): IMerkleNode | undefined;  // Get parent node
    setParent(node: IMerkleNode): void;    // Set parent node
    isLeaf(): boolean;
    getDepth(): number;
    verifyNode(): boolean;
}

export interface IMerkleTree {
    globalMerkleTree: IGlobalMerkleTree;
    addTransactionHash(hash: string): void;
    verifyTransactionHash(hash: string): boolean;
    getRoot(): IMerkleNode | undefined;
    getLeafCount(): number;
    getTreeDepth(): number;
    getLeafNodes(): IMerkleNode[];
    getProof(hash: string): { path: string[], pathHashes: string[] };
    verifyProof(hash: string): boolean;
    clone(): IMerkleTree;
    merge(other: IMerkleTree): IMerkleTree;
}

class MerkleNode implements IMerkleNode {
    private hash: string;
    private leftChild: IMerkleNode | undefined;
    private rightChild: IMerkleNode | undefined;
    private parent: IMerkleNode | undefined;


    constructor(hash: string, parent?: IMerkleNode) {
        this.hash = hash;
        this.parent = parent;
    }

    public getHash(): string {
        return this.hash;
    }

    public getLeftChild(): IMerkleNode | undefined {
        return this.leftChild;
    }

    public getRightChild(): IMerkleNode | undefined {
        return this.rightChild;
    }

    public setLeftChild(node: IMerkleNode): void {
        this.leftChild = node;
        node.setParent(this); // The node itself should never be explicitly undefined when set
    }
    
    public setRightChild(node: IMerkleNode): void {
        this.rightChild = node; // Same as above
    }

    public getParent(): IMerkleNode | undefined {
        return this.parent;
    }

    public setParent(node: IMerkleNode): void {
        this.parent = node;
    }

    public isLeaf(): boolean {
        return !this.leftChild && !this.rightChild;
    }

    public getDepth(): number {
        if (!this.parent) return 0;
        return this.parent.getDepth() + 1;
    }

    public verifyNode(): boolean {
        if (this.isLeaf()) {
            // Leaf nodes are considered inherently valid or are validated by external data integrity checks.
            return true;
        }
        let childrenHashes = '';
        if (this.leftChild) {
            childrenHashes += this.leftChild.getHash();
        }
        if (this.rightChild) {
            childrenHashes += this.rightChild.getHash();
        }
        // Recalculate the hash based on children and compare it to this node's hash.
        const recalculatedHash = this.calculateHash(childrenHashes);
        return this.hash === recalculatedHash;
    }

    private calculateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

export class MerkleTree implements IMerkleTree {
    private root: IMerkleNode | undefined;
    private leafNodes: IMerkleNode[] = [];
    public globalMerkleTree: IGlobalMerkleTree;

    constructor(globalMerkleTree: IGlobalMerkleTree) {
        this.globalMerkleTree = globalMerkleTree;
    }

    public insertNode(hash: string): void {
        const newLeafNode = new MerkleNode(hash);
        this.leafNodes.push(newLeafNode);
        if (!this.root) {
            this.root = newLeafNode;
        } else {
            this.recalculateTree();
            this.updateGlobalTree();
        }
    }

    private recalculateTree(): void {
        let levelNodes = this.leafNodes;
        if (levelNodes.length === 1) {
            this.root = levelNodes[0]; // Directly set root if only one node exists
            return;
        }
        while (levelNodes.length > 1) {
            const newLevel = [];
            for (let i = 0; i < levelNodes.length; i += 2) {
                if (i + 1 < levelNodes.length) {
                    const parentNode = new MerkleNode(this.calculateHash(levelNodes[i].getHash() + levelNodes[i + 1].getHash()));
                    parentNode.setLeftChild(levelNodes[i]);
                    parentNode.setRightChild(levelNodes[i + 1]);
                    newLevel.push(parentNode);
                } else {
                    newLevel.push(levelNodes[i]); // Odd node at the end stays at the same level
                }
            }
            levelNodes = newLevel; // Move up one level
        }
        this.root = levelNodes[0]; // The last node is the new root
        this.updateGlobalTree();
    }

    private updateGlobalTree(): void {
        if (this.root) {
            this.globalMerkleTree.addLocalRoot(this.root.getHash());
        }
    }

    private calculateHash(data: string): string {
        // Create a SHA-256 hash of the data
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    public addTransactionHash(hash: string): void {
        const newLeafNode = new MerkleNode(hash);
        this.leafNodes.push(newLeafNode);
        this.recalculateTree();
    }

    public verifyTransactionHash(hash: string): boolean {
        return this.leafNodes.some(node => node.getHash() === hash && node.verifyNode());
    }

    public getRoot(): IMerkleNode | undefined {
        return this.root;
    }

    public getLeafCount(): number {
        return this.leafNodes.length;
    }

    public getTreeDepth(): number {
        return this.root ? this.root.getDepth() : 0;
    }

    public getLeafNodes(): IMerkleNode[] {
        return this.leafNodes;
    }

    public getProof(hash: string): { path: string[], pathHashes: string[] } {
        let node = this.leafNodes.find(n => n.getHash() === hash);
        if (!node) {
            return { path: [], pathHashes: [] }; // Return an empty proof if no node with the hash exists
        }
    
        const path: string[] = [];
        const pathHashes: string[] = [];
    
        while (node.getParent()) {
            const parent = node.getParent();
            if (!parent) break; // Ensure there is a parent to avoid infinite loops
    
            if (parent.getLeftChild() === node) {
                path.push('L');
                pathHashes.push(parent.getRightChild()?.getHash() || ''); // Safely handle undefined sibling
            } else {
                path.push('R');
                pathHashes.push(parent.getLeftChild()?.getHash() || ''); // Safely handle undefined sibling
            }
            node = parent;
        }
    
        return { path, pathHashes };
    }
    

    public verifyProof(hash: string): boolean {
        // Find the leaf node first
        const leafNode = this.leafNodes.find(node => node.getHash() === hash);
        if (!leafNode) {
            return false;
        }
    
        let currentNode = leafNode;
        while (currentNode) {
            if (!currentNode.verifyNode()) {
                return false;
            }
            const parent = currentNode.getParent();
            if (!parent) {
                break;  // If there's no parent, we've reached the root, end the loop
            }
            currentNode = parent;
        }
        // If we successfully get back to the root and all hashes are correct, the proof is valid
        return true; // Assuming root is always valid as it is recalculated whenever the tree changes
    }

    public clone(): IMerkleTree {
        const clone = new MerkleTree(this.globalMerkleTree);
        this.leafNodes.forEach(node => clone.addTransactionHash(node.getHash()));
        return clone;
    }

    public merge(other: IMerkleTree): IMerkleTree {
        const clone = this.clone();
        other.getLeafNodes().forEach(node => clone.addTransactionHash(node.getHash()));
        return clone;
    }
}
