## 0.0.14
* rcli arg tweak in `buildArgInfos` that sets the arg.name to
  the param name and not a synonym if a synonym was used.
  * test added for this

## 0.0.13
* break: changed `getParamInfo` to NOT throw if the param is not found.
  * added `throwIfNotFound` to get same old behavior.
  * other function `buildArgInfos` acs the same, since it sets the throw flag.
  * I'm changing this because in actual use, it's annoying to check for an
    arg which may not be there. Even though it breaks, this is still so young
    and no one else is using it, so meh.

## 0.0.12
* progress: added synonyms to RCLIParamInfo
  * adjusted rcli helpers
  * added unit testing for rcli helpers

## 0.0.11
* meta: refactor RLI to RCLI
  * Robbotic Commmand Line Interface,
  * or, Request/Command Line Interface.
  * these are intended to be used in RCLI apps that incorporate
    both command- and request-based interactions.
    * the thinking behind this is to marry both sides of
      deterministic command-based thinking to the freedom and
      autonomy associated with the future of ibgib robbots. so
      ultimately commands must continue to grow to emulate more
      complex requests. Robbots will strive to maintain integrity
      as more freedom is given.
* progress: added promptForBoolean
  * untested? I'm unsure of the state of this, if I'm using it in other libs.
  * removed cruft logging in curtailing getSaferText

## 0.0.10
* progress: tweaking node-helper
  * deprecating _node suffixes.
    * i'm thinking this will in the future have multiple implementations and it
      would be good to keep the same signature (use an interface in the future).
  * added `isFile` node helper
    * untested
  * added `promptForConfirm` function
    * untested

## 0.0.9
* added RLI basics.
  * refactored from another project.
  * untested (except they were working in other libs)
* added a couple node helper functions.
  * refactored from another project.
  * untested (except they were working in other libs)

## 0.0.6
* basic extra respec implemented to focus on single/subsets of respec
  execution.

## 0.0.5
* added respec-gib testing harness functionality
  * simple testing framework to do basic unit/integration testing.
  * will see about breaking out into its own lib at some point.

## 0.0.1/2
* meta: initial commit
  * getting basic folder structure going
  * typescript + es modules
  * testing with both node and browser via jasmine.
  * already has some of the core helper functionality from ts-gib and ionic-gib.
* meta: reorg and ts-gib functions
  * slight cleanup of organization helper files/folders.
    * changed "common" to "helpers" folder
    * added index.mts
    * exporting in base index.mts via helpers/index.mts instead of individual files.
  * incorporated helper functions from ts-gib.
  * all tests passing. This should be ready to consume in ts-gib (or close to it).
