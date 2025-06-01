/**
 * Data structure for a keystone.
 *
 * @see {@link KeystoneIbGib_V1} for the full keystone structure.
 */
export interface KeystoneData_V1 {
    /**
     * Format for the expiration date.
     * V1 is UTC only.
     */
    expirationFormat?: 'UTC';
    /**
     * Expiration date/time of the keystone.
     *
     * @example "Mon, 01 Jan 4321 12:34:56 GMT"
     */
    expiration?: string;
    /**
     * Active challenges for this keystone.
     * These are the challenges that need to be solved.
     *
     * @key challengeSalt
     * @value challengeResult (hash)
     */
    challenges: { [challengeSalt: string]: string };
    /**
     * Solutions to the challenges of the *previous* keystone in the timeline.
     * This will be empty for the first keystone in a timeline (tjp).
     *
     * @key challengeSalt
     * @value [challengeResult, challengeSecret]
     */
    solutions?: { [challengeSalt: string]: [string, string] };
}

/**
 * Relationships for a keystone.
 *
 * @see {@link KeystoneIbGib_V1} for the full keystone structure.
 */
export interface KeystoneRel8ns_V1 {
    /**
     * The past timeline of this keystone.
     * The first entry is typically the "temporal junction point" (tjp) for this keystone's timeline.
     * For the very first keystone, this might be an "undefined" tjp.
     *
     * @example ["keystone mut8 undefined^QQQ123"]
     */
    past?: string[];
    /**
     * Metadata about this keystone.
     * Most importantly, this should link to the keystone's configuration.
     *
     * @example ["keystone config^ZZZ111"]
     */
    meta?: string[];
    /**
     * Other keystones related to this one, e.g., for recovery or revocation.
     *
     * @example [
     *   "keystone recover [keystoneTjpGib]^YYY444",
     *   "keystone revoke [keystoneTjpGib]^XXX555"
     * ]
     */
    keystone?: string[];
}

/**
 * Represents a keystone ibGib.
 * This is the primary structure for managing cryptographic challenges and solutions
 * within the ibGib ecosystem.
 *
 * It should be analogous to the IbGib_V1 interface from @ibgib/ts-gib.
 * Since we can't import that directly, we'll define the common fields here.
 */
export interface KeystoneIbGib_V1 {
    /**
     * The "ib" part of the ibGib, representing its context or type.
     * For a keystone, this often includes its scope and tjp gib.
     *
     * @example "keystone mut8 QQQ123"
     * @example "keystone [scope={transform}] [keystoneTjpGib]"
     */
    ib: string;
    /**
     * The cryptographic hash of the (ib, data, rel8ns) content,
     * serving as its unique identifier.
     */
    gib?: string;
    /**
     * Intrinsic data of the keystone.
     */
    data: KeystoneData_V1;
    /**
     * Extrinsic relationships of the keystone.
     */
    rel8ns: KeystoneRel8ns_V1;
    /**
     * DNA of the ibGib, for forking and merging.
     * Not directly used by the keystone's core logic but part of the ibGib structure.
     */
    dna?: any; // Adjust 'any' if a more specific type can be used from documentation
}

/**
 * Configuration for how keystone challenges are generated and validated.
 */
export interface KeystoneConfigData_V1 {
    /**
     * Version of the keystone config structure.
     */
    version: 'v1';
    /**
     * Configuration for the challenges themselves.
     */
    challenges: KeystoneChallengeConfig_V1;
    /**
     * Describes how a node might generate a challengeSecret from its keySecret.
     * This is a suggestion, and nodes are responsible for their own secret generation.
     */
    suggestedChallengeSecretMethod?: KeystoneSuggestedSecretMethod_V1;
}

/**
 * Detailed configuration for challenges within a keystone.
 */
export interface KeystoneChallengeConfig_V1 {
    /**
     * Type of challenge. V1 is 'hash'.
     */
    type: 'hash';
    /**
     * Minimum number of challenges that must be solved to pass.
     */
    minChallengesRequired: number;
    /**
     * Maximum number of challenges that can be solved.
     * (This might be interpreted as the number of challenges presented,
     * or an upper limit if challenges are dynamically generated).
     */
    maxChallengesRequired: number; // Or perhaps "totalChallengesPresented"
    /**
     * Minimum length of the challenge salt.
     * Implied SHA-256 for V1.
     */
    minChallengeSaltSize: number;
    /**
     * Maximum length of the challenge salt.
     * Implied SHA-256 for V1.
     */
    maxChallengeSaltSize: number;
    /**
     * Number of recursive hash iterations to perform on
     * (challengeSecret + challengeSalt + ...).
     */
    hashIterations: number;
    /**
     * Hashing algorithm to use. V1 implies SHA-256.
     */
    algo?: 'SHA-256' | string; // Allow other strings for future flexibility
}

/**
 * Suggested method for deriving a challengeSecret from a keySecret.
 */
export interface KeystoneSuggestedSecretMethod_V1 {
    /**
     * Number of hash iterations when generating the challengeSecret from keySecret + challengeSalt.
     */
    hash: number;
    /**
     * Could include algorithm here too if it can vary from the main challenge algo.
     */
    // algo?: 'SHA-256' | string;
}

/**
 * Represents a keystone configuration ibGib.
 * This governs how its associated keystones operate.
 */
export interface KeystoneConfigIbGib_V1 {
    /**
     * The "ib" part, typically indicating its a keystone configuration.
     * @example "keystone config"
     */
    ib: string;
    /**
     * The cryptographic hash.
     */
    gib?: string;
    /**
     * Configuration data.
     */
    data: KeystoneConfigData_V1;
    /**
     * Relationships, likely minimal for a config object but included for completeness.
     * Might include 'past' if the config itself is versioned.
     */
    rel8ns?: {
        past?: string[];
        // other rel8ns if necessary
    };
    dna?: any;
}
