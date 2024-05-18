import { SignatureShare, Participant, MPCWallet } from '../src/ThresholdMPC';
import { ITransaction, Transaction } from '../src/Transaction';
import bigInt from "big-integer";
import { createHash } from 'crypto';
import utils, { ethers } from 'ethers';
import 'ethers';

/*describe('Polynomial Coefficient Handling', () => {

    test('handles coefficients larger than modulus', () => {
        const coefficients = [bigInt(502), bigInt(753), bigInt(1004)]; // Values larger than the modulus 251
        const xValue = bigInt(1); // Simple case where x = 1
        const modulus = 251;
        const threshold = 3; // Example threshold, might not be necessary depending on your implementation
        const mpcWallet = new MPCWallet(threshold, modulus); // Corrected constructor usage

        // Corrected expected result based on proper modulus calculation
        const expectedResult = (1004*1**2 + 753*1 + 502) % modulus; // should be 4, not 0
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('adjusts negative coefficients correctly', () => {
        const coefficients = [bigInt(-100), bigInt(-300), bigInt(-500)];
        const xValue = bigInt(1);
        const modulus = 251;
        const threshold = 3; // Again, assuming threshold needed
        const mpcWallet = new MPCWallet(threshold, modulus);

        const expectedAdjustedCoefficients = [151, 202, 2];  // Correct expected values after modulus adjustment
        const adjustedCoefficients = mpcWallet.adjustCoefficients(coefficients);
    
        // Log the output for debugging
        console.log("Expected:", expectedAdjustedCoefficients);
        console.log("Received:", adjustedCoefficients.map(c => c.toJSNumber()));
    
        expect(adjustedCoefficients.map(c => c.toJSNumber())).toEqual(expectedAdjustedCoefficients);
    
        const expectedResult = 104; // Expected result for polynomial: 2*1^2 + 202*1 + 151 = 355 % 251 = 104
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });
    
});

describe('Polynomial Evaluation', () => {
    const modulus = 251;
    const threshold = 3;
    const mpcWallet = new MPCWallet(threshold, modulus);

   test('evaluates polynomial at x = 0 correctly', () => {
        const coefficients = [bigInt(30), bigInt(20), bigInt(10)];
        const xValue = bigInt(0);
        const expectedResult = 10; // Only the constant term should be returned
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('evaluates polynomial with positive x-value correctly', () => {
        const coefficients = [bigInt(3), bigInt(4), bigInt(5)]; // 5x^2 + 4x + 3
        const xValue = bigInt(1);
        const expectedResult = 12; // 5*1^2 + 4*1 + 3
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('handles negative x-values correctly', () => {
        const coefficients = [bigInt(5), bigInt(-4), bigInt(3)];
        const xValue = bigInt(-1);
        const expectedResult = 12; // 5*(-1)^2 - 4*(-1) + 3 = 5 + 4 + 3
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('handles large x-values correctly', () => {
        const coefficients = [bigInt(200), bigInt(100), bigInt(15)];
        const xValue = bigInt(10);
        const expectedResult = (200 * 10 ** 2 + 100 * 10 + 15) % modulus;
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('correctly handles polynomial where all coefficients are zero', () => {
        const coefficients = [bigInt(0), bigInt(0), bigInt(0)];
        const xValue = bigInt(5);
        const expectedResult = 0; // Zero polynomial should always return 0
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('evaluates polynomial at x = 1 correctly', () => {
        const coefficients = [bigInt(1), bigInt(2), bigInt(3)];
        const xValue = bigInt(1);
        const expectedResult = 6; // 1*1^2 + 2*1 + 3 = 1 + 2 + 3
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });

    test('evaluates polynomial at x = -2 correctly', () => {
        const coefficients = [bigInt(2), bigInt(3), bigInt(4)];
        const xValue = bigInt(-2);
        const expectedResult = 2 * (-2) ** 2 + 3 * (-2) + 4; // 2*(-2)^2 + 3*(-2) + 4
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedResult);
    });
});*/




/*describe('MPCWallet Polynomial Evaluation', () => {
    let mpcWallet: any;
    const modulus = 251;

    beforeEach(() => {
        mpcWallet = new MPCWallet(3, modulus);  // Assuming threshold of 3 for these tests
    });

    test('evaluates polynomial at x = 0', () => {
        const coefficients = [bigInt(123), bigInt(10), bigInt(76)];  // 76x^2 + 10x + 123
        const xValue = bigInt(0);
        const expectedValue = 123;  // At x=0, result should be the constant term
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('evaluates polynomial with negative x-value', () => {
        const coefficients = [bigInt(123), bigInt(10), bigInt(76)];  // 76x^2 + 10x + 123
        const xValue = bigInt(-1);
        const expectedValue = 139;  // 76*(-1)^2 + 10*(-1) + 123 = 189 % 251 = 139
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('handles coefficients larger than modulus', () => {
        const coefficients = [bigInt(500), bigInt(300), bigInt(800)];  // 800x^2 + 300x + 500
        const xValue = bigInt(1);
        const expectedValue = 101;  // (800*1^2 + 300*1 + 500) % 251 = 1600 % 251 = 101
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('correctly handles polynomial where all coefficients are zero', () => {
        const coefficients = [bigInt(0), bigInt(0), bigInt(0)];  // 0x^2 + 0x + 0
        const xValue = bigInt(10);  // Any x value should work
        const expectedValue = 0;  // Result should always be 0
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('evaluates large x-values', () => {
        const coefficients = [bigInt(123), bigInt(10), bigInt(76)];  // 76x^2 + 10x + 123
        const xValue = bigInt(1000);  // Large x value
        const expectedValue = 7;  // Calculated manually or via an external tool for accuracy
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('randomized coefficients and x-values', () => {
        for (let i = 0; i < 10; i++) {
            const coeff1 = bigInt(Math.floor(Math.random() * 1000));
            const coeff2 = bigInt(Math.floor(Math.random() * 1000));
            const coeff3 = bigInt(Math.floor(Math.random() * 1000));
            const coefficients = [coeff1, coeff2, coeff3];  // Random coefficients
            const xValue = bigInt(Math.floor(Math.random() * 100));
            const expectedResult = coeff3.multiply(xValue.pow(2)).add(coeff2.multiply(xValue)).add(coeff1).mod(modulus).toJSNumber();
            const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
            expect(result.toJSNumber()).toBe(expectedResult);
        }
    });
});*/

describe('MPCWallet', () => {
    let mpcWallet: MPCWallet;
    //const modulus = 251;
    const modulus = bigInt('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16);
    const threshold = 3;

    /*beforeEach(() => {
        mpcWallet = new MPCWallet(threshold, modulus);
    });

    test('correctly evaluates polynomial', () => {
        const coefficients = [bigInt(76), bigInt(10), bigInt(123)];  // Corresponds to 76x^2 + 10x + 123
        const xValue = bigInt(1);
        const expectedValue = 209;  // As calculated: 76*1^2 + 10*1 + 123 = 209
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('handles larger inputs correctly', () => {
        const coefficients = [bigInt(76), bigInt(10), bigInt(123)]; 
        const xValue = bigInt(2);
        const expectedValue = 196;  // 76*2^2 + 10*2 + 123 = 447 % 251 = 196
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result.toJSNumber()).toBe(expectedValue);
    });

    test('Key Reconstruction', () => {
        const privateKeyHex = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const privateKeyBigInt = bigInt(privateKeyHex.slice(2), 16); // Convert hex to bigint
    
        // Assuming distributeKey might be async in future implementations
        const shares = mpcWallet.distributeKey(privateKeyBigInt, 5); // Distribute key among 5 participants
        console.log('shares: ', shares.map(share => [share[0], share[1].toString(16)])); // Log shares as hex
    
        // Assuming reconstructKey might be async in future implementations
        const reconstructed = mpcWallet.reconstructKey(shares.slice(0, 3)); // Use threshold of 3 shares to reconstruct
        expect(reconstructed.equals(privateKeyBigInt)).toBe(true); // Check if reconstructed key matches the original
    });

    test('distributeKey generates valid shares', () => {
        const secret = bigInt('1234567890123456789012345678901234567890'); // Large number as a BigInt
        const shares = mpcWallet.distributeKey(secret, 5);
        expect(shares.length).toBe(5);
        shares.forEach(([id, share], index) => {
            expect(id).toBeGreaterThan(0);
            // Check if share is indeed a BigInt
            expect(bigInt.isInstance(share)).toBeTruthy();
            // Ensure the share is a valid positive number and within the range [0, modulus)
            expect(share.geq(bigInt.zero)).toBeTruthy(); // share >= 0
            expect(share.lt(bigInt(mpcWallet.modulus))).toBeTruthy(); // share < modulus
        });
    });

    test('lagrangeInterpolation reconstructs the correct secret', () => {
        const secret = 123;
        const shares = mpcWallet.distributeKey(secret, threshold);
        const reconstructedSecret = mpcWallet.reconstructKey(shares);
        expect(reconstructedSecret).toBe(secret);
    });

    describe('executeTransaction', () => {
        it('executes with valid signature shares', async () => {
            const transaction = new Transaction('Alice', 'recipient', 100, 'dummy_signature');
            const secret = 123;
            const shares = mpcWallet.distributeKey(secret, 5);
            const signatureShares = shares.map(([id, share]) => ({
                participantId: id.toString(),
                signature: Buffer.from(`${transaction.getHash()}_${share}`)
            }));

            shares.forEach(([id, share]) => {
                mpcWallet.addParticipant({ id, publicKey: 'public_key', privateKeyShare: [id, share] });
            });

            const result = await mpcWallet.executeTransaction(transaction, signatureShares.slice(0, threshold));
            expect(result).toBeTruthy();
        })
    });*/

    describe('MPCWallet', () => {
        let mpcWallet: MPCWallet;
    
        /*beforeEach(() => {
            mpcWallet = new MPCWallet(3, 251); // Threshold = 3 and modulus = 251
        });
    
        test('adds participant correctly', () => {
            const participant: Participant = {
                id: 1,
                publicKey: 'publicKey',
                privateKeyShare: [1, 2]
            };
            mpcWallet.addParticipant(participant);
            expect(mpcWallet['participants'].size).toBe(1);
        });
    
        test('creates transaction correctly', async () => {
            const transaction = new Transaction('sender', 'receiver', 100, 'signature');
            const signatureShare = await mpcWallet.createTransaction(transaction);
            expect(signatureShare.participantId).toBe('local');
            expect(signatureShare.signature.length).toBeGreaterThan(0);
        });
    
        test('executes transaction successfully', async () => {
            // Mock participants
            const participants: Participant[] = [];
            for (let i = 1; i <= 5; i++) {
                participants.push({
                    id: i,
                    publicKey: `publicKey${i}`,
                    privateKeyShare: [i, i + 1]
                });
            }
            participants.forEach(participant => mpcWallet.addParticipant(participant));

            // Mock transaction
            const transaction = new Transaction('sender', 'receiver', 100, 'signature');
            transaction.getId = jest.fn().mockReturnValue('transactionId');
            transaction.getTo = jest.fn().mockReturnValue('receiver');
            transaction.getAmount = jest.fn().mockReturnValue(100);
            transaction.getHash = jest.fn().mockReturnValue('transactionHash');
        
            // Distribute shares
            const secret = 123;
            const shares = mpcWallet.distributeKey(secret, 5); // Distribute key among 5 participants
        
            // Mock signature shares
            const signatureShares = shares.map(([id]) => ({
                participantId: id.toString(),
                signature: Buffer.from(`signature${id}`)
            }));
        
            // Mock key reconstruction
            mpcWallet.reconstructKey = jest.fn().mockReturnValueOnce(12345);
        
            const result = await mpcWallet.executeTransaction(transaction, signatureShares);
            expect(result).toBeTruthy();
        });*/
        
    });

});
/*
describe('Combine Signatures for Ethereum Transactions', () => {
    const mpcWallet = new MPCWallet(3, 10); // Example threshold and modulus

    test('Combine Partial Signatures and Submit Ethereum Transaction', async () => {
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/354354ac39174e8da331e1a987fa7ca0');
        // Generate test Ethereum transaction
        const transactionData = {
            to: '0xB7fB856A1e52c13C77710963D7C89fc8Af16D819',
            value: ethers.parseEther('0.1'), // Sending 0.1 Ether
            gasLimit: 21000,
            gasPrice: ethers.parseUnits('10', 'gwei'), // Gas price in Gwei
            nonce: await provider.getTransactionCount('0xa5CD4997e80bE31a0a6d3C53b663E833ecaB85cC') // Nonce for the transaction
        };
        

        // Simulate distribution of private key shares among participants
        const shares = mpcWallet.distributeKey(privateKeyBigInt, 5); // Distribute key among 5 participants
        console.log('shares: ', shares.map(share => [share[0], share[1].toString(16)])); // Log shares as hex

        // Sign the transaction using each participant's private key share
        const partialSignatures: SignatureShare[] = [];
        for (const share of shares) {
            const partialSignature = await mpcWallet.signTransaction(transactionData, share);
            partialSignatures.push(partialSignature);
        }

        // Combine partial signatures
        const finalSignature = mpcWallet.combineSignatures(partialSignatures);

        // Submit the transaction to a test Ethereum network or log for manual verification
        mpcWallet.submitTransaction(transactionData, finalSignature);
    });
});*/