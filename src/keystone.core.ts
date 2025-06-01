import * as crypto from 'crypto'; // Needed for calculateGib if implemented fully
import {
    KeystoneIbGib_V1,
    KeystoneData_V1,
    KeystoneRel8ns_V1,
    KeystoneConfigIbGib_V1,
    KeystoneChallengeConfig_V1,
    KeystoneConfigData_V1, // Added
    KeystoneSuggestedSecretMethod_V1 // Added
} from './keystone.types';
import {
    generateChallengeSalt,
    generateChallengeSecret,
    calculateChallengeResult
} from './keystone.crypto';
import { getIbGibAddr, calculateGib as calculateGibUtil } from './utils'; // Renamed to avoid conflict

export function createInitialKeystone(
    ib: string,
    config: KeystoneConfigIbGib_V1,
    initialKeySecret: string
): KeystoneIbGib_V1 {

    const keystoneData: KeystoneData_V1 = {
        challenges: {},
        solutions: {},
    };

    const challengeConfig = config.data.challenges;
    const secretMethodConfig = config.data.suggestedChallengeSecretMethod;

    let numChallengesToCreate = challengeConfig.maxChallengesRequired;
    if (challengeConfig.minChallengesRequired > numChallengesToCreate) {
        numChallengesToCreate = challengeConfig.minChallengesRequired;
    }
    if (numChallengesToCreate <= 0) {
        numChallengesToCreate = 1; // Always create at least one challenge
    }

    for (let i = 0; i < numChallengesToCreate; i++) {
        const saltLength = (challengeConfig.minChallengeSaltSize && challengeConfig.minChallengeSaltSize > 0) ?
                           Math.ceil(challengeConfig.minChallengeSaltSize / 2) :
                           9;
        const challengeSalt = generateChallengeSalt(saltLength);
        const challengeSecret = generateChallengeSecret(initialKeySecret, challengeSalt, secretMethodConfig);
        const challengeResult = calculateChallengeResult(challengeSecret, challengeSalt, challengeConfig);
        keystoneData.challenges[challengeSalt] = challengeResult;
    }

    const keystoneRel8ns: KeystoneRel8ns_V1 = {
        past: [],
        meta: [getIbGibAddr({ ib: config.ib, gib: config.gib })],
        keystone: [],
    };

    const newKeystone: KeystoneIbGib_V1 = {
        ib: ib,
        gib: undefined, // Will be set by a separate "gibbify" process
        data: keystoneData,
        rel8ns: keystoneRel8ns,
    };

    return newKeystone;
}

/**
 * Completes a keystone by calculating its gib.
 * This is a simplified version. True gib calculation is more complex.
 * Mutates the keystone by setting its gib.
 */
export function gibbifyKeystone(keystone: KeystoneIbGib_V1): void {
    // In a real scenario, ensure data and rel8ns are canonically stringified.
    // The order of keys in objects, etc., matters for hashing.
    // For now, a simple JSON stringification.
    const contentToHash = JSON.stringify({
        ib: keystone.ib,
        data: keystone.data,
        rel8ns: keystone.rel8ns
        // DNA should also be included if present
    });
    const hash = crypto.createHash('sha256');
    hash.update(contentToHash);
    keystone.gib = hash.digest('hex');
}

export function createDefaultKeystoneConfig(ib: string = "keystone config default"): KeystoneConfigIbGib_V1 {
    const challengeConfig: KeystoneChallengeConfig_V1 = {
        type: 'hash',
        minChallengesRequired: 1,
        maxChallengesRequired: 3, // Create 3 challenges by default
        minChallengeSaltSize: 32, // e.g., 32 bytes for a SHA256 hash as salt (64 hex chars)
        maxChallengeSaltSize: 32,
        hashIterations: 5,        // Iterations for challengeResult calculation
        algo: 'SHA-256'
    };

    const suggestedSecretMethod: KeystoneSuggestedSecretMethod_V1 = {
        hash: 5 // Iterations for challengeSecret generation
    };

    const configData: KeystoneConfigData_V1 = {
        version: 'v1',
        challenges: challengeConfig,
        suggestedChallengeSecretMethod: suggestedSecretMethod
    };

    const configIbGib: KeystoneConfigIbGib_V1 = {
        ib: ib,
        gib: undefined, // Will be set by a separate "gibbify" process
        data: configData,
        rel8ns: {
            past: []
        }
    };

    // It's good practice to also have a way to "gibbify" config objects
    // Similar to gibbifyKeystone. We can reuse or make a generic one later.
    // For now, like keystones, gib is set separately.
    return configIbGib;
}

/**
 * Completes a keystone config by calculating its gib.
 * Mutates the config by setting its gib.
 * This can be a more generic function in the future.
 */
export function gibbifyKeystoneConfig(config: KeystoneConfigIbGib_V1): void {
    const contentToHash = JSON.stringify({
        ib: config.ib,
        data: config.data,
        rel8ns: config.rel8ns
        // DNA should also be included if present
    });
    const hash = crypto.createHash('sha256');
    hash.update(contentToHash);
    config.gib = hash.digest('hex');
}
