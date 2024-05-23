import { MPCWallet } from '../src/ThresholdMPC';
import bigInt from "big-integer";

describe('MPCWallet', () => {
    let mpcWallet: MPCWallet;
    const modulus = bigInt('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16);
    const threshold = 3;

    beforeEach(() => {
        mpcWallet = new MPCWallet(threshold, modulus);
    });

    test('correctly evaluates polynomial', () => {
        const coefficients = [bigInt(76), bigInt(10), bigInt(123)];  // Corresponds to 76x^2 + 10x + 123
        const xValue = bigInt(1);
        const expectedValue = bigInt(209);  // Calculated: 76*1^2 + 10*1 + 123 = 209
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result).toEqual(expectedValue);
    });

    test('handles larger inputs correctly', () => {
        const coefficients = [bigInt(76), bigInt(10), bigInt(123)]; 
        const xValue = bigInt(2);
        const expectedValue = bigInt(447);  // Updated expectation: 76*2^2 + 10*2 + 123 = 447 (under the large modulus used)
        const result = mpcWallet.evaluatePolynomial(coefficients, xValue);
        expect(result).toEqual(expectedValue);
    });

    test('Key Reconstruction', async () => {
        const privateKeyHex = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const privateKeyBigInt = bigInt(privateKeyHex.slice(2), 16);
    
        const shares = mpcWallet.distributeKey(privateKeyBigInt, 5);
        const reconstructed = mpcWallet.reconstructKey(shares.slice(0, 3));
        expect(reconstructed).toEqual(privateKeyBigInt);
    });

    test('distributeKey generates valid shares', () => {
        const secret = bigInt('1234567890123456789012345678901234567890');
        const shares = mpcWallet.distributeKey(secret, 5);
        expect(shares.length).toBe(5);
        shares.forEach(([id, share], index) => {
            expect(id).toBeGreaterThan(0);
            expect(bigInt.isInstance(share)).toBeTruthy();
            expect(share.geq(bigInt.zero)).toBeTruthy(); // share >= 0
            expect(share.lt(modulus)).toBeTruthy(); // share < modulus
        });
    });

    test('lagrangeInterpolation reconstructs the correct secret', () => {
        const secret = bigInt(123);
        const shares = mpcWallet.distributeKey(secret, threshold);
        const reconstructedSecret = mpcWallet.reconstructKey(shares);
        expect(reconstructedSecret).toEqual(secret);
    });

});
