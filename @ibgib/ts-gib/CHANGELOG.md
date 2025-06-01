## 0.5.22/23
* Tweaked `toNormalizedForHashing` to normalize arrays slightly differently.
  * Instead of returning the raw array, the fn now maps each member to its
    normalized version. This way objects _inside_ those arrays are normalized,
    as would be expected, but the actual order of the array itself is preserved.


## 0.5.21
* correcting bare imports in all libs/apps
* updated helper-gib, ts-gib and encrypt-gib.

## 0.5.6
* impl: added `validateRel8nsIntrinsically` and respecs
  * i decided not to change `validateIbGibIntrinsically` to also call this.
    * would add performance hit.
    * perhaps if needed this can be done in the future.
  * added respecs for `validateIbGibIntrinsically`
  * also cleaned up some imports
    * changed broad imports -> individual file imports.

## 0.5.2
* meta: changed to respec-gib for testing.

## 0.5.1
* meta: reorg V1/index.mts to export * from transform-helper
  * was only exporting a subset, forcing consumers to import certain fns
    specially from transform-helper path.

## 0.5.0
* meta: reorg/refactor with @ibgib/helper-gib
* extracted non-ibgib-related functions, e.g. `hash`, `clone`, `pretty`, etc.,
  into the new @ibgib/helper-gib lib.
  * adjusted readme to include section on how to modify the run.html.ejs for
    the import map to point to @ibgib/helper-gib.
  * removed all tests related to these functions.
  * adjusted imports, including trying to remove references to
    `import * as h from 'helper.mjs'` and similar.
* added a couple specs for `getIbGibAddr` and `getIbAndGib`
* tweaked (added/changed) some documentation in code, in general trying
  to clean things up.
* added some return type annotations
  * fingers crossed, i.e., will be tested in reorg/refactor

## 0.4.8
* migrating to scoped npm package @ibgib/ts-gib
* continued refinement of meta files eg .npmignore, .gitignore, tsconfig, etc.
* aligned with other projects to put packed files in ./published
  * manual backups of these...should I have these in version control?

## 0.4.2
* enabled test framework to execute in both node and browser contexts.
  * changed test framework to jasmine
    * https://jasmine.github.io/pages/getting_started.html
    * esm changes
      * now ts uses *.mts file extensions to ultimately produce *.mjs files that
        indicate esm modules.
      * package.json `"type": "module"` added.
  * migrated mocha/chai tests to jasmine syntax.
    * had to change nested async describe blocks to single-level describes.
    * mimicked nested `describe` blocks using `withContext`.
    * recommended to jasmine to reexaminehttps://github.com/jasmine/jasmine/issues/1487
  * synced .vscode/tasks.json
* IN PROGRESS: still working on ensuring library can be consumed in both other node packages.
  * i need to consume this in my upcoming `space-gib` package.
  * ultimately i will need to consume this in front end apps and cli apps.
  * https://nodejs.org/api/esm.html
    * need to look at package.json exports section
    * currently have a "main" key that points to "dist/index.js"
      * this may need to be broken out into "import" and "require" sub paths.
      * need to do more testing obviously.
  * https://www.typescriptlang.org/docs/handbook/esm-node.html
  * https://levelup.gitconnected.com/transpiling-typescript-into-double-packages-commonjs-esm-d6b62cfc851c
    * found various blogs online, but this one seems to be the best.
    * if i use the strategy where you create a commonjs only with esm wrapper,
      then you don't get tree-shaking.
    * the tree-shaking aspect reminds me that ultimately i'm looking to utilize
      ibgib + src granularity in a completely new way.
* added helper function `extractErrorMsg`
  * added tests.
  * maybe unnecessary, but i came across a bug in ionic-gib where trying to
    hash/getGib for large file (400MB) was throwing an error in FF that was a
    string and not an error proper.
* cleaned up some cruft

## 0.4.0/1
* isomorphic crypto changes
  * simplify hashing to use node v19+ `globalThis.crypto`
    * quick check with FF and Chrome on my mac shows they use this.
    * node.js does NOT have `globalThis.crypto`
  * got rid of node/browser set_target build file kluge
  * ~todo: continue deleting cruft, but I'm checking in to bump version for testing pack.~
    * done


## 0.3.14/15
* major bug fix, but I'm leaving the minor version number the same. It's not
  really a breaking change, as opposed to an important fix.
  * the `fork` and `rel8` transforms were calculating the gibs **before**
    adding the dna to the rel8ns when the `dna` param was true.
    * definitely still alpha but good god, how did I miss this?
  * changing `getGib` function in `transform-helper.ts`.
    * changed `hasTjp` param to optional.
      * now it always looks internally if falsy.
    * now ignoring incoming `tjpAddr`.
      * always checks internally for this.

## 0.3.12/13
* still "fixing" bug in transform-helper.ts `getGib` function.
  * Apparently I was returning the wrong gib for tjp ibgibs with data.isTjp ===
    true.
    * Idk how tf this was going before...sigh. (I wasn't validating as much as I
      am now.)
    * That's (pre)alpha for you.

## 0.3.10/11
* fixed bug in transform-helper.ts `getGib` function.
  * incorrectly threw error when didn't find tjp addr in rel8ns but ibgib itself
    was tjp (data.isTjp was true).
* Minor error formatting changes.
  * shortened (ERROR: ...) to (E: ...) and (WARNING: ...) to (W: ...)

## 0.3.8/9
* Tweak to transforms `nCounter`/`data.n` functionality.
  * Before, you had to explicitly set `nCounter` in transform options every time.
    But really, once there is a tjp (and consequently `data.n`), it should always be incrementing
    with every transform automatically.
    * In the future there may be a domain use for `data.n`, but we will
      reexamine this when it becomes a priority.

## 0.3.6/7
* Tweak to transforms to create a projection of src with only
  `ib`,`gib`,`data`,`rel8ns` properties.
  * I'm getting a cyclic error because I'm mutating an ibGib src object that has additional properties.
    The tweak just creates an intermediate dto before cloning the src, which should obviate the
    possibility of a cyclic error if `data` is well-behaved (a map of only primitives).

## 0.3.0/1/2/3/4/5
* BREAKING
  * I am putting the tjp in the gib of those ibgibs with tjps (temporal junction points).
    * `${ib}^${hash}${GIB_DELIMITER}${tjpgib}` for those with tjps.
      * `GIB_DELIMITER` defaulting to '.'
      * e.g. "abc^gib456" will be "abc^gib456.tjp123"
      * e.g. "comment hello^5d43dd4100324c4e93c9ee678c4141b4" to "comment hello^5d43dd4100324c4e93c9ee678c4141b4.690e715e0975403a9247e5b94a3209f0" with 690e715e0975403a9247e5b94a3209f0 being the comment ibgib's tjp.gib.
* So many patch versions because of bad packing/versioning on my part. Eek.

## 0.2.0/1
* BREAKING
  * removing `src` from transform data.
  * doing this because...
    * we can apply dna to any src without having to delete this addr.
    * makes dna less unique/more reusable
    * this information is already captured in the created ibGib's 'dna' rel8n.
* tweaking workspace colors.
* removed some commented cruft

## 0.1.55/56
* Slight readme changes.

## 0.1.53/54
* package.json scripts for npm publishing convenience.

## 0.1.51/52
* added TRel8ns generic to `IbGib_V1` interface to enable customization of rel8ns.
  * this is in addition to existing TData enabling data customization.
* had some difficulties with versions...eesh.

## 0.1.43/44
* added sha-512 to helper
  * NOT IN ANY IBGIB_V1 CONTENT ADDRESSING. This is strictly for the base helper function.

## 0.1.39/40
* bug fix: linked rel8ns were only working with past/ancestor (hard-coded).
  * now linkedRel8ns work as expected.
  * added some tests and whatnot.

## 0.1.37/38
* tweak - cleared out src.rel8ns.tjp when forking.

## 0.1.35/36
* Added tjp metadata to really make it more feasible to track ibGib timelines.

## 0.1.27
* No idea...eesh. Quite a bit of version differences since updated this.
  * I'm just trying to get it back up and going.
  * I have it passing tests on node@16 with dreams of isomorphic crypto one day.
  * Have not tested it in a browser plugin to see if crypto is working on
    browser side.

## 0.1.9
* Added factory firstGen functionality for creating first generation ibGibs.
  * The driving use case for this is creating meta ibGibs like for storing settings

## 0.1.0

ts-gib is back with redone core. So this is basically an initial (re)commit.

# notes

I'm publishing two versions of this lib at a time. **USUALLY** the odd number is the
node version (because that is how I run `npm test`), and the higher even number is
the browser target. But maybe I've switched these up...sigh. Anyway. Alternating
friggin browser/node targets.
