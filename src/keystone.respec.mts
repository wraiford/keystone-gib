import { getIbGibAddr } from './utils'; // Assuming this is the correct path from compiled output
import {
    generateChallengeSalt,
    generateChallengeSecret,
    calculateChallengeResult,
    validateChallengeSolution
} from './keystone.crypto'; // Adjust path as needed based on tsconfig output
import {
    createDefaultKeystoneConfig,
    gibbifyKeystoneConfig,
    createInitialKeystone,
    gibbifyKeystone
} from './keystone.core'; // Adjust path as needed
import {
    KeystoneChallengeConfig_V1,
    KeystoneIbGib_V1,
    KeystoneConfigIbGib_V1,
    KeystoneSuggestedSecretMethod_V1,
    KeystoneData_V1, // Added
    KeystoneRel8ns_V1, // Added
    KeystoneConfigData_V1 // Added
} from './keystone.types'; // Adjust path as needed

const respec = new Respec();
const { test, given, when, then, comment } = respec;

const TEST_KEY_SECRET = "this-is-a-very-secret-key-dont-tell-anyone";

test("Keystone Crypto Functions", async (r) => {
    await given("a keySecret and a challengeSalt", async () => {
        const keySecret = TEST_KEY_SECRET;
        const challengeSalt = generateChallengeSalt(10); // 10 bytes = 20 hex chars
        r.context.keySecret = keySecret;
        r.context.challengeSalt = challengeSalt;

        await when("generating a challengeSecret", async () => {
            const secretMethodConfig: KeystoneSuggestedSecretMethod_V1 = { hash: 3 };
            const generatedSecret = generateChallengeSecret(keySecret, challengeSalt, secretMethodConfig);
            r.context.generatedSecret = generatedSecret;

            await then("it should produce a non-empty string", () => {
                r.expect(generatedSecret).to.be.a('string');
                r.expect(generatedSecret.length > 0).to.equal(true);
            });

            await given("a challengeConfig", async () => {
                const challengeConfig: Pick<KeystoneChallengeConfig_V1, 'hashIterations' | 'algo'> = {
                    hashIterations: 4,
                    algo: 'sha256'
                };
                r.context.challengeConfig = challengeConfig;

                await when("calculating the challengeResult", async () => {
                    const calculatedResult = calculateChallengeResult(generatedSecret, challengeSalt, challengeConfig);
                    r.context.calculatedResult = calculatedResult;

                    await then("it should produce a non-empty string (SHA-256 hash)", () => {
                        r.expect(calculatedResult).to.be.a('string');
                        r.expect(calculatedResult.length).to.equal(64); // SHA-256 hex length
                    });

                    await when("validating the solution with the correct secret", async () => {
                        const isValid = validateChallengeSolution(generatedSecret, challengeSalt, calculatedResult, challengeConfig);
                        await then("it should return true", () => {
                            r.expect(isValid).to.equal(true);
                        });
                    });

                    await when("validating the solution with an incorrect secret", async () => {
                        const incorrectSecret = "not-the-right-secret";
                        const isValid = validateChallengeSolution(incorrectSecret, challengeSalt, calculatedResult, challengeConfig);
                        await then("it should return false", () => {
                            r.expect(isValid).to.equal(false);
                        });
                    });
                });
            });
        });
    });
});

test("Keystone Config Creation", async (r) => {
    await given("a request to create a default keystone config", async () => {
        const configIb = "test default config";
        r.context.configIb = configIb;

        await when("createDefaultKeystoneConfig is called", async () => {
            const defaultConfig = createDefaultKeystoneConfig(configIb);
            r.context.defaultConfig = defaultConfig;

            await then("it should return a KeystoneConfigIbGib_V1 object", () => {
                r.expect(defaultConfig).to.exist;
                r.expect(defaultConfig.ib).to.equal(configIb);
                r.expect(defaultConfig.data.version).to.equal('v1');
                r.expect(defaultConfig.data.challenges).to.exist;
                r.expect(defaultConfig.data.suggestedChallengeSecretMethod).to.exist;
            });

            await when("gibbifyKeystoneConfig is called", async () => {
                gibbifyKeystoneConfig(defaultConfig);
                await then("the config should have a gib property defined", () => {
                    r.expect(defaultConfig.gib).to.be.a('string');
                    r.expect(defaultConfig.gib.length).to.equal(64);
                });
            });
        });
    });
});

test("Initial Keystone Creation", async (r) => {
    await given("a default keystone config and a key secret", async () => {
        const config = createDefaultKeystoneConfig("test config for keystone");
        gibbifyKeystoneConfig(config); // Config needs a gib to be linked
        r.context.config = config;
        r.context.keySecret = TEST_KEY_SECRET;
        r.context.keystoneIb = "test initial keystone";

        await when("createInitialKeystone is called", async () => {
            const initialKeystone = createInitialKeystone(r.context.keystoneIb, config, r.context.keySecret);
            r.context.initialKeystone = initialKeystone;

            await then("it should return a KeystoneIbGib_V1 object", () => {
                r.expect(initialKeystone).to.exist;
                r.expect(initialKeystone.ib).to.equal(r.context.keystoneIb);
                r.expect(initialKeystone.data).to.exist;
                r.expect(initialKeystone.rel8ns).to.exist;
            });

            await then("its data.challenges should be populated", () => {
                const numChallenges = Object.keys(initialKeystone.data.challenges).length;
                r.expect(numChallenges).to.equal(config.data.challenges.maxChallengesRequired);
                for (const salt in initialKeystone.data.challenges) {
                    r.expect(initialKeystone.data.challenges[salt]).to.be.a('string');
                    r.expect(initialKeystone.data.challenges[salt].length).to.equal(64);
                }
            });

            await then("its data.solutions should be empty initially", () => {
                r.expect(Object.keys(initialKeystone.data.solutions).length).to.equal(0);
            });

            await then("its rel8ns.meta should link to the config gib", () => {
                r.expect(initialKeystone.rel8ns.meta).to.include(getIbGibAddr(config));
            });

            await when("gibbifyKeystone is called", async () => {
                gibbifyKeystone(initialKeystone);
                await then("the keystone should have a gib property defined", () => {
                    r.expect(initialKeystone.gib).to.be.a('string');
                    r.expect(initialKeystone.gib.length).to.equal(64);
                });
            });
        });
    });
});

test("Keystone Challenge-Solution Flow (Happy Path)", async (r) => {
    await given("an initial keystone (K1) with challenges", async () => {
        const config = createDefaultKeystoneConfig("flow-config");
        gibbifyKeystoneConfig(config);
        r.context.config = config;

        const k1_ib = "keystone_k1_flow";
        const k1_keySecret = "k1_secret_for_flow";
        const k1 = createInitialKeystone(k1_ib, config, k1_keySecret);
        gibbifyKeystone(k1);
        r.context.k1 = k1;
        r.context.k1_keySecret = k1_keySecret;

        r.expect(Object.keys(k1.data.challenges).length > 0).to.equal(true);

        await when("creating a subsequent keystone (K2) that solves a challenge from K1", async () => {
            const k2_ib = "keystone_k2_flow";
            // K2 will have its own key secret for *its* future challenges,
            // but it needs k1_keySecret to solve K1's challenges.
            const k2_keySecret_for_its_own_challenges = "k2_secret_for_its_own_future";

            // Pick a challenge from K1 to solve
            const saltsInK1 = Object.keys(k1.data.challenges);
            const challengeSaltFromK1 = saltsInK1[0];
            const challengeResultFromK1 = k1.data.challenges[challengeSaltFromK1];

            // To solve it, K2 (or its controller) needs to know k1_keySecret
            const secretToSolveK1Challenge = generateChallengeSecret(
                r.context.k1_keySecret, // K1's secret
                challengeSaltFromK1,
                config.data.suggestedChallengeSecretMethod
            );

            // Verify this secret is correct for K1's challenge (sanity check)
            const isSecretCorrectForK1 = validateChallengeSolution(
                secretToSolveK1Challenge,
                challengeSaltFromK1,
                challengeResultFromK1,
                config.data.challenges
            );
            r.expect(isSecretCorrectForK1).to.equal(true, "Secret generated for K1's challenge should be valid for K1");

            // K2 is a new keystone, it will have its own challenges.
            // For this test, we are focusing on K2 *solving* K1's challenge.
            // So, K2's `data.solutions` will reference K1's challenge.
            const k2 = createInitialKeystone(k2_ib, config, k2_keySecret_for_its_own_challenges);
            // Now, populate K2's solutions map
            k2.data.solutions = {
                [challengeSaltFromK1]: [challengeResultFromK1, secretToSolveK1Challenge]
            };
            // K2's `past` should point to K1
            k2.rel8ns.past = [getIbGibAddr(k1)];

            gibbifyKeystone(k2);
            r.context.k2 = k2;

            await then("K2's solutions map should contain the solved challenge from K1", () => {
                r.expect(k2.data.solutions).to.exist;
                r.expect(k2.data.solutions[challengeSaltFromK1]).to.exist;
                r.expect(k2.data.solutions[challengeSaltFromK1][0]).to.equal(challengeResultFromK1);
                r.expect(k2.data.solutions[challengeSaltFromK1][1]).to.equal(secretToSolveK1Challenge);
            });

            await then("K2's past rel8n should point to K1", () => {
                r.expect(k2.rel8ns.past).to.include(getIbGibAddr(k1));
            });

            await then("K2 should still have its own challenges defined", () => {
                r.expect(Object.keys(k2.data.challenges).length > 0).to.equal(true);
                 // Ensure K2's challenges are different from K1's solved one if secrets differ
                if (k1_keySecret !== k2_keySecret_for_its_own_challenges) {
                    const k2ChallengeSalt = Object.keys(k2.data.challenges)[0];
                    if (k2ChallengeSalt === challengeSaltFromK1) {
                         r.expect(k2.data.challenges[k2ChallengeSalt]).to.not.equal(challengeResultFromK1, "K2's own challenge (if same salt) should have a different result due to different keySecret");
                    }
                }
            });

            await comment("Now, manually verify K2's solution against K1's original challenge (as an external observer would)");
            const solutionProvidedByK2 = k2.data.solutions[challengeSaltFromK1];
            const providedSecret = solutionProvidedByK2[1];
            const isValidAccordingToK1sChallenge = validateChallengeSolution(
                providedSecret,
                challengeSaltFromK1, // salt from K1's challenge
                challengeResultFromK1, // result from K1's challenge
                r.context.config.data.challenges // K1's config
            );
            r.expect(isValidAccordingToK1sChallenge).to.equal(true, "Solution in K2 must be valid for K1's challenge");

        });
    });
});

test("Gibbify Keystone - Uniqueness", async (r) => {
    await given("two slightly different keystones", async () => {
        const config = createDefaultKeystoneConfig("gibbify-test-config");
        gibbifyKeystoneConfig(config);

        const k1 = createInitialKeystone("gibbify-k1", config, "secret1");
        gibbifyKeystone(k1); // Calculate gib for k1

        // Create k2 identical to k1 for now
        const k2_data: KeystoneData_V1 = JSON.parse(JSON.stringify(k1.data));
        const k2_rel8ns: KeystoneRel8ns_V1 = JSON.parse(JSON.stringify(k1.rel8ns));
        const k2: KeystoneIbGib_V1 = {
            ib: "gibbify-k2-variant", // Different ib
            data: k2_data,
            rel8ns: k2_rel8ns,
        };
        // No gibbify yet for k2

        r.context.k1 = k1;
        r.context.k2_variant_ib = k2;

        const k3_data: KeystoneData_V1 = JSON.parse(JSON.stringify(k1.data));
        // Modify k3's data slightly
        k3_data.expiration = "2099-12-31";
        const k3_rel8ns: KeystoneRel8ns_V1 = JSON.parse(JSON.stringify(k1.rel8ns));
        const k3: KeystoneIbGib_V1 = {
            ib: k1.ib, // Same ib as k1
            data: k3_data, // Different data
            rel8ns: k3_rel8ns,
        };
        r.context.k3_variant_data = k3;


        await when("gibbifyKeystone is called on them", async () => {
            gibbifyKeystone(r.context.k2_variant_ib);
            gibbifyKeystone(r.context.k3_variant_data);

            await then("their gibs should be different from k1's gib and each other", () => {
                r.expect(r.context.k1.gib).to.exist;
                r.expect(r.context.k2_variant_ib.gib).to.exist;
                r.expect(r.context.k3_variant_data.gib).to.exist;

                r.expect(r.context.k2_variant_ib.gib).to.not.equal(r.context.k1.gib, "K2 gib (different ib) should not equal K1 gib");
                r.expect(r.context.k3_variant_data.gib).to.not.equal(r.context.k1.gib, "K3 gib (different data) should not equal K1 gib");
                r.expect(r.context.k3_variant_data.gib).to.not.equal(r.context.k2_variant_ib.gib, "K3 gib should not equal K2 gib");
            });
        });
    });
});

test("Initial Keystone Creation - Challenge Count Logic", async (r) => {
    await given("a keystone config with specific min/max challenge requirements", async () => {
        const configData_Min2Max5: KeystoneConfigData_V1 = {
            version: 'v1',
            challenges: { type: 'hash', minChallengesRequired: 2, maxChallengesRequired: 5, minChallengeSaltSize: 8, maxChallengeSaltSize: 8, hashIterations: 1, algo: 'sha256' },
            suggestedChallengeSecretMethod: { hash: 1 }
        };
        const config_Min2Max5: KeystoneConfigIbGib_V1 = { ib: "config-c1", data: configData_Min2Max5 };
        gibbifyKeystoneConfig(config_Min2Max5);

        const configData_Min3Max2: KeystoneConfigData_V1 = { // min > max
            version: 'v1',
            challenges: { type: 'hash', minChallengesRequired: 3, maxChallengesRequired: 2, minChallengeSaltSize: 8, maxChallengeSaltSize: 8, hashIterations: 1, algo: 'sha256' },
            suggestedChallengeSecretMethod: { hash: 1 }
        };
        const config_Min3Max2: KeystoneConfigIbGib_V1 = { ib: "config-c2", data: configData_Min3Max2 };
        gibbifyKeystoneConfig(config_Min3Max2);

        const configData_Min0Max0: KeystoneConfigData_V1 = { // min=0, max=0
            version: 'v1',
            challenges: { type: 'hash', minChallengesRequired: 0, maxChallengesRequired: 0, minChallengeSaltSize: 8, maxChallengeSaltSize: 8, hashIterations: 1, algo: 'sha256' },
            suggestedChallengeSecretMethod: { hash: 1 }
        };
        const config_Min0Max0: KeystoneConfigIbGib_V1 = { ib: "config-c3", data: configData_Min0Max0 };
        gibbifyKeystoneConfig(config_Min0Max0);

        r.context.configs = { config_Min2Max5, config_Min3Max2, config_Min0Max0 };
        r.context.keySecret = "challenge-count-secret";

        await when("createInitialKeystone is called with these configs", async () => {
            const k1 = createInitialKeystone("k-c1", config_Min2Max5, r.context.keySecret);
            const k2 = createInitialKeystone("k-c2", config_Min3Max2, r.context.keySecret);
            const k3 = createInitialKeystone("k-c3", config_Min0Max0, r.context.keySecret);

            await then("the number of challenges created should respect the logic (at least min, capped by max if valid, else at least 1)", () => {
                // k1: min=2, max=5. Should create 5.
                r.expect(Object.keys(k1.data.challenges).length).to.equal(5, "K1: maxChallengesRequired should be used");

                // k2: min=3, max=2. Refined logic: numChallenges = max(2,3) => 3.
                r.expect(Object.keys(k2.data.challenges).length).to.equal(3, "K2: minChallengesRequired should be used if greater than max");

                // k3: min=0, max=0. Refined logic: numChallenges = max(0,0) => 0, then defaults to 1.
                r.expect(Object.keys(k3.data.challenges).length).to.equal(1, "K3: Should default to 1 challenge if min/max are zero");
            });
        });
    });
});

// This is necessary for the respec runner to pick up the tests
export { respec };
