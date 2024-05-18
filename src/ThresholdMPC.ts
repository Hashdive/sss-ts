

import { ITransaction } from './Transaction';
import { randomBytes, createHash } from 'crypto';
import bigInt from "big-integer";// Import big-integer library for handling big integers
import { ethers, Wallet } from 'ethers';

export interface Participant {
    id: number;
    publicKey: string;
    privateKeyShare: [number, number];  // ID and KEYSHARE
}

export interface SignatureShare {
    participantId: string;
    signature: string;  // Signatures are also binary data
}

interface IMPCWallet {
    addParticipant(participant: Participant): void;
}

export class MPCWallet implements IMPCWallet {
    private participants: Map<number, Participant>;
    private threshold: number;
    private modulus: bigInt.BigInteger;

    constructor(threshold: number, modulus: bigInt.BigInteger) {
        this.threshold = threshold;
        this.modulus = modulus;
        this.participants = new Map();
    }

    generateRandomCoefficients(degree: number): bigInt.BigInteger[] {
        let coeffs: bigInt.BigInteger[] = [];
        for (let i = 0; i < degree; i++) {
            let randomNum = bigInt(randomBytes(4).readUInt32LE()).mod(this.modulus);
            coeffs.push(randomNum);
        }
        return coeffs;
    }

    adjustCoefficients(coefficients: bigInt.BigInteger[]): bigInt.BigInteger[] {
        let modulusBigInt = bigInt(this.modulus);
        return coefficients.map(coeff => {
            let adjustedCoeff = coeff.mod(modulusBigInt);
            if (adjustedCoeff.isNegative()) {
                adjustedCoeff = adjustedCoeff.add(modulusBigInt);
            }
            return adjustedCoeff;
        });
    }

    customModulo(x: bigInt.BigInteger, n: bigInt.BigInteger): bigInt.BigInteger {
        const result = x.mod(n);
        if (result.isNegative()) {
            return result.add(n);
        }
        return result;
    }

    evaluatePolynomial(coefficients: bigInt.BigInteger[], x: bigInt.BigInteger): bigInt.BigInteger {
        if (bigInt(this.modulus).isZero()) {
            throw new Error("Modulus cannot be zero.");
        }

        let result = bigInt.zero;
        let modulusBigInt = bigInt(this.modulus);
        console.log(`Evaluating polynomial with modulus: ${modulusBigInt.toString()}`);

        // Ensure x is within the range [0, modulus - 1]
        x = this.customModulo(x, modulusBigInt);
        console.log('x post mod: ', x);

        for (let index = 0; index < coefficients.length; index++) {
            console.log(`Processing coefficient [${index}]: ${coefficients[index].toString()}`);

            // Calculate x to the power of index
            let exponent = coefficients.length - index - 1;
            let xPower = x.modPow(bigInt(exponent), modulusBigInt);
            console.log(`x^${index}: ${xPower.toString()}`);

            // Multiply the coefficient by x raised to the index
            let term = coefficients[index].multiply(xPower);
            term = this.customModulo(term, modulusBigInt);
            console.log(`Term after multiplication: ${term.toString()}`);

            // Add the term to the result
            result = result.add(term).mod(modulusBigInt);
            console.log(`Result after adding term: ${result.toString()}`);
        }

        return result;
    }

    distributeKey(secret: bigInt.BigInteger, n: number): Array<[number, bigInt.BigInteger]> {
        let coefficients = this.generateRandomCoefficients(this.threshold - 1);
        coefficients.push(secret); // Directly use the bigInt secret
        console.log('coefficients: ', coefficients.map(c => c.toString()));
        let shares: Array<[number, bigInt.BigInteger]> = [];
        for (let i = 1; i <= n; i++) {
            let shareValue = this.evaluatePolynomial(coefficients, bigInt(i));
            console.log(`Share for participant ${i}: `, shareValue.toString());
            shares.push([i, shareValue]);
        }
        return shares;
    }
    
    
    normalizeMod(value: bigInt.BigInteger, modulus: bigInt.BigInteger): bigInt.BigInteger {
        let result = value.mod(modulus);
        if (result.isNegative()) {
            result = result.add(modulus);
        }
        return result;
    }

    lagrangeInterpolation(shares: Array<[number, bigInt.BigInteger]>): bigInt.BigInteger {
        let secret = bigInt.zero;
        let modulusBigInt = bigInt(this.modulus);
    
        for (let i = 0; i < shares.length; i++) {
            let [xi, yi] = shares[i];
            let xiBigInt = bigInt(xi);
            let yiBigInt = yi; // Already a bigInt
            let numerator = bigInt.one;
            let denominator = bigInt.one;
    
            for (let j = 0; j < shares.length; j++) {
                if (i !== j) {
                    let [xj] = shares[j];
                    let xjBigInt = bigInt(xj);
                    numerator = numerator.multiply(xjBigInt.negate()).mod(modulusBigInt);
                    denominator = denominator.multiply(xiBigInt.subtract(xjBigInt)).mod(modulusBigInt);
                }
            }
    
            numerator = this.normalizeMod(numerator, modulusBigInt);
            denominator = this.normalizeMod(denominator, modulusBigInt);
    
            let li = numerator.multiply(denominator.modInv(modulusBigInt)).mod(modulusBigInt);
            let term = yiBigInt.multiply(li).mod(modulusBigInt);
            secret = this.normalizeMod(secret.add(term), modulusBigInt);
        }
    
        return secret; // Return as bigInt
    }
    

    reconstructKey(shares: Array<[number, bigInt.BigInteger]>): bigInt.BigInteger {
        return this.lagrangeInterpolation(shares);
    }

    addParticipant(participant: Participant): void {
        if (!this.participants.has(participant.id)) {
            this.participants.set(participant.id, participant);
        } else {
            throw new Error('Participant already exists.');
        }
    }

    async signTransaction(transactionData: ethers.TransactionRequest, privateKeyShare: [number, string]): Promise<SignatureShare> {
        const wallet = new ethers.Wallet(privateKeyShare[1]); // Create a wallet instance using the private key
        const signedTransaction = await wallet.signTransaction(transactionData); // Sign the transaction
        return { participantId: privateKeyShare[0].toString(), signature: signedTransaction };
    }

    combineSignatures(partialSignatures: SignatureShare[]): string {
        // Implement combining logic here to produce the final signature
        // For simplicity, let's just concatenate the partial signatures
        const combinedSignature = partialSignatures.map(sig => sig.signature).join('');
        return combinedSignature;
    }

    async submitTransaction(provider: ethers.JsonRpcProvider, transactionData: ethers.TransactionRequest, signerPrivateKey: string): Promise<void> {
        // Create a wallet instance with the private key and connect it to the provider
        const signer = new ethers.Wallet(signerPrivateKey, provider);
    
        console.log('Submitting Ethereum transaction:');
        console.log('Transaction Data:', transactionData);
        
        try {
            // Send transaction using the signer
            const txResponse = await signer.sendTransaction(transactionData); // Send the transaction
            console.log('Transaction submitted:', txResponse.hash);
    
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log('Transaction confirmed:', receipt);
        } catch (error) {
            console.error('Error submitting transaction:', error);
        }
    }

}

   /* async createTransaction(transaction: ITransaction): Promise<SignatureShare> {
        const transactionHash = transaction.getHash();
        // Simulate creating a signature share (hypothetically calling a secure MPC protocol function)
        const signatureShare = Buffer.from(createHash('sha256').update(transactionHash + randomBytes(16).toString()).digest('hex'));
        return {
            participantId: 'local',
            signature: signatureShare
        };
    }

    async executeTransaction(transaction: ITransaction, signatureShares: SignatureShare[]): Promise<boolean> {
        console.log("Executing transaction...");
        
        // Check if there are enough signature shares
        console.log(`Checking if there are enough signature shares (Threshold: ${this.threshold})...`);
        if (signatureShares.length < this.threshold) {
            console.error('Not enough signatures to meet the threshold');
            return false;
        }
    
        // Validate each signature share
        console.log("Validating each signature share...");
        const validShares: [number, number][] = [];
        for (const share of signatureShares) {
            const participantId = Number(share.participantId); // Convert string to number
            const participant = this.participants.get(participantId);
            if (!participant) {
                console.error(`Participant ID ${share.participantId} not found.`);
                return false; // Exit the function if a participant is not found
            }
    
            // Assuming share.signature is a hexadecimal string representing a number
            const signatureNumber = parseInt(share.signature.toString('hex'), 16); // Convert Buffer to hexadecimal string and then parse it
            if (isNaN(signatureNumber)) {
                console.error(`Invalid signature from participant ID ${share.participantId}.`);
                return false; // Exit the function if the signature is invalid
            }
    
            validShares.push([participantId, signatureNumber]);
        }
    
        console.log('Valid shares: ', validShares);
    
        // Check if the number of valid signature shares meets the threshold
        console.log("Checking if the number of valid signature shares meets the threshold...");
        if (validShares.length < this.threshold) {
            console.error('Valid signatures do not meet the threshold required for transaction execution.');
            return false;
        }
    
        // Reconstruct the key from valid shares
        console.log("Reconstructing key from valid shares...");
        const reconstructedKey = this.reconstructKey(validShares);
        console.log('Reconstructed key: ', reconstructedKey);
    
        // Optionally, use the reconstructed key to verify some aspect of the transaction or to perform the transaction
        console.log("Verifying transaction...");
        const transactionHash = transaction.getHash();
        const expectedHash = createHash('sha256').update(`${transactionHash}-${reconstructedKey}`).digest('hex');
        console.log('Transaction hash: ', transactionHash);
        console.log('Expected hash: ', expectedHash);
    
        // Perform additional checks or log transaction details
        if (expectedHash !== transaction.getHash()) {
            console.error('Transaction hash does not match expected hash after key reconstruction.');
            return false;
        }
    
        console.log(`Transaction ${transaction.getId()} to ${transaction.getTo()} with value ${transaction.getAmount()} executed successfully.`);
        return true;
    }*/
    
    


    // Methods to simulate creating and verifying transactions can be added here
    // using the reconstructed key or directly working with the shares
