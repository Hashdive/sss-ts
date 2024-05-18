// Assuming InMemoryDataStore is a class that implements IDataStore
import { DAG } from "../src/DAG";
import { Transaction } from "../src/Transaction";
import InMemoryDataStore  from "../src/storage/InMemoryGunDataStore";
import { ProofOfWork, MerkleProofConsensus } from "../src/DAGConsensus";
import { MerkleTree } from "../src/DAGMerkle";
import { GlobalMerkleTree } from "../src/GlobalMerkle";

describe('DAG', () => {
    let dag: DAG;
    let transaction1: Transaction;
    let transaction2: Transaction;
    let transaction3: Transaction;
    let transaction4: Transaction;
    let globalMerkleTree: any, merkleTree: any;

    beforeEach(() => {
        // Pass the class itself, not an instance
        const difficultyLevel = 4;
        globalMerkleTree = new GlobalMerkleTree;
        merkleTree = new MerkleTree(globalMerkleTree);
        const merkleProof = new MerkleProofConsensus(merkleTree);
        dag = new DAG(InMemoryDataStore, "dagTest", merkleProof, merkleTree );
        transaction1 = new Transaction('from1', 'to1', 100, 'signature1');
        transaction2 = new Transaction('from2', 'to2', 200, 'signature2');
        transaction3 = new Transaction('from3', 'to3', 300, 'signature3');
        transaction4 = new Transaction('from4', 'to4', 400, 'signature4');
    });

    it('should add a transaction to the DAG', async () => {
        await dag.addTransaction(transaction1);
        expect(await dag.getTransaction(transaction1.getId())).toEqual(transaction1);
    });

    it('should add transactions to the mempool', () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        expect(dag.getMempool()).toContain(transaction1);
        expect(dag.getMempool()).toContain(transaction2);
    });

    it('should remove transactions from the mempool', () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        dag.removeFromMempool(transaction1);
        expect(dag.getMempool()).not.toContain(transaction1);
        expect(dag.getMempool()).toContain(transaction2);
    });

    it('should process transactions from the mempool to the DAG', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        await dag.processMempool();
        expect(await dag.getTransaction(transaction1.getId())).toEqual(transaction1);
        expect(await dag.getTransaction(transaction2.getId())).toEqual(transaction2);
        expect(dag.getMempool()).not.toContain(transaction1);
        expect(dag.getMempool()).not.toContain(transaction2);
        expect(await dag.verifyTransaction(transaction1.getId())).toBe(true);
        expect(await dag.verifyTransaction(transaction2.getId())).toBe(true);
    });

    it('should get the parents of a transaction', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        await dag.addParentChild(transaction1.getId(), transaction2.getId());
        const parents = await dag.getParents(transaction2);
        expect(parents).toContain(transaction1);
    });

    it('should get the children of a transaction', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        await dag.addParentChild(transaction1.getId(), transaction2.getId());
        const children = await dag.getChildren(transaction1);
        expect(children).toContain(transaction2);
    });

    it('should validate a valid DAG', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        await dag.addTransaction(transaction3);
        await dag.addParentChild(transaction1.getId(), transaction2.getId());
        await dag.addParentChild(transaction2.getId(), transaction3.getId());
        expect(await dag.isValid()).toBe(true);
    });

    it('should invalidate a DAG with duplicate transactions', async () => {
        await dag.addTransaction(transaction1);
        await expect(dag.addTransaction(transaction1)).rejects.toThrow("Transaction already exists.");
    });
    

    it('should invalidate a DAG with orphaned transactions', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2); // No parent-child link defined here
        expect(await dag.isValid()).toBe(false);
    });

    it('should invalidate a DAG with cyclic dependencies', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        await dag.addTransaction(transaction3);
        await dag.addParentChild(transaction1.getId(), transaction2.getId());
        await dag.addParentChild(transaction2.getId(), transaction3.getId());
        await dag.addParentChild(transaction3.getId(), transaction1.getId());
        expect(await dag.isValid()).toBe(false);
    });

    it('should update the Merkle Tree correctly when transactions are added', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        const rootHashBefore = dag.merkleTree.getRoot()?.getHash();
        await dag.addTransaction(transaction3);
        const rootHashAfter = dag.merkleTree.getRoot()?.getHash();
        expect(rootHashBefore).not.toEqual(rootHashAfter);
    });

    it('should maintain consistent merkle proofs for transactions', async () => {
        await dag.addTransaction(transaction1);
        await dag.addTransaction(transaction2);
        await dag.addTransaction(transaction3);
        const proof1 = dag.merkleTree.getProof(transaction1.getId());
        expect(dag.merkleTree.verifyProof(transaction1.getId())).toBe(true);
        expect(proof1.path.length).toBeGreaterThan(0);
        expect(proof1.pathHashes.length).toBe(proof1.path.length);
    });

    it('should maintain Merkle Tree consistency after processing mempool', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        const rootHashBefore = dag.merkleTree.getRoot()?.getHash();
        await dag.processMempool();
        const rootHashAfter = dag.merkleTree.getRoot()?.getHash();
        expect(rootHashBefore).not.toEqual(rootHashAfter);
        expect(await dag.merkleTree.verifyTransactionHash(transaction1.getId())).toBe(true);
        expect(await dag.merkleTree.verifyTransactionHash(transaction2.getId())).toBe(true);
    });

    it('should correctly reflect changes in GlobalMerkleTree', () => {
        globalMerkleTree.addLocalRoot("testHash");
        expect(globalMerkleTree.getRootHash()).toBe("testHash"); 
    });

    it('should reflect changes in Global Merkle Tree after processing mempool', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        const rootBeforeProcess = globalMerkleTree.getRootHash();
        await dag.processMempool();
        const rootAfterProcess = globalMerkleTree.getRootHash();
        expect(rootBeforeProcess).not.toEqual(rootAfterProcess);
    });

    it('should update the Global Merkle Tree when a transaction is added', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        await dag.processMempool();
        const globalRootHash = await globalMerkleTree.getRootHash();
        expect(globalRootHash).not.toBeNull();
        expect(globalMerkleTree.verifyLocalRootInGlobalTree(merkleTree.getRoot()?.getHash())).toBe(true);
    });

    it('should maintain global root consistency after multiple transactions', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        await dag.processMempool();
        const initialGlobalRoot = globalMerkleTree.getRootHash();
        await dag.addTransaction(transaction3);
        await dag.addTransaction(transaction4);
        const updatedGlobalRoot = globalMerkleTree.getRootHash();
        expect(initialGlobalRoot).not.toEqual(updatedGlobalRoot);
        expect(globalMerkleTree.verifyLocalRootInGlobalTree(merkleTree.getRoot()?.getHash())).toBe(true);
    });

    it('should verify transaction using Global Merkle Tree', async () => {
        dag.addToMempool(transaction1);
        dag.addToMempool(transaction2);
        await dag.processMempool();
        const proof = merkleTree.getProof(transaction1.getId());
        expect(merkleTree.verifyProof(transaction1.getId())).toBe(true);
        // Simulating a cross-validation where the local proof impacts the global state verification
        expect(globalMerkleTree.verifyLocalRootInGlobalTree(merkleTree.getRoot()?.getHash())).toBe(true);
    });
    
    // Add more test cases for other methods and scenarios
});
