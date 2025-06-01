import * as crypto from 'crypto';
import { KeystoneChallengeConfig_V1, KeystoneSuggestedSecretMethod_V1 } from './keystone.types';

export function generateChallengeSalt(length: number = 9): string {
    return crypto.randomBytes(length).toString('hex');
}

export function generateChallengeSecret(
    keySecret: string,
    challengeSalt: string,
    secretMethodConfig?: KeystoneSuggestedSecretMethod_V1
): string {
    const iterations = secretMethodConfig?.hash ?? 5;
    const algo = 'sha256';

    let currentSecret = '';
    for (let i = 0; i < iterations; i++) {
        const hash = crypto.createHash(algo);
        hash.update(keySecret + challengeSalt + currentSecret);
        currentSecret = hash.digest('hex');
    }
    return currentSecret;
}

export function calculateChallengeResult(
    challengeSecret: string,
    challengeSalt: string,
    challengeConfig: Pick<KeystoneChallengeConfig_V1, 'hashIterations' | 'algo'>
): string {
    const iterations = challengeConfig.hashIterations;
    const algo = challengeConfig.algo ?? 'sha256';

    let currentResult = '';
    for (let i = 0; i < iterations; i++) {
        const hash = crypto.createHash(algo);
        hash.update(challengeSecret + challengeSalt + currentResult);
        currentResult = hash.digest('hex');
    }
    return currentResult;
}

/**
 * Validates a given challengeSecret against a known challengeSalt and challengeResult.
 * It does this by recalculating the result using the provided secret and salt,
 * then comparing it to the expected result.
 *
 * @param challengeSecret The secret being validated.
 * @param challengeSalt The salt used in the challenge.
 * @param expectedChallengeResult The known correct result for this salt.
 * @param challengeConfig Configuration for the challenge hashing (hashIterations, algo).
 * @returns True if the secret produces the expected result, false otherwise.
 */
export function validateChallengeSolution(
    challengeSecret: string,
    challengeSalt: string,
    expectedChallengeResult: string,
    challengeConfig: Pick<KeystoneChallengeConfig_V1, 'hashIterations' | 'algo'>
): boolean {
    const calculatedResult = calculateChallengeResult(
        challengeSecret,
        challengeSalt,
        challengeConfig
    );
    return calculatedResult === expectedChallengeResult;
}
