import { randomBytes } from 'crypto';
import bigInt from "big-integer";// Import big-integer library for handling big integers


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
    distributeKey(secret: bigInt.BigInteger, n: number): Array<[number, bigInt.BigInteger]>;
    reconstructKey(shares: Array<[number, bigInt.BigInteger]>): bigInt.BigInteger;
}

export class MPCWallet implements IMPCWallet {
    private participants: Map<number, Participant>;
    private threshold: number;
    public modulus: bigInt.BigInteger;

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

}