# 🚧

I have created a working MVP for ibgib that shows some of the potential for the
architecture:

* try it out
  * https://ibgib.space
* pre-refactored MVP codebase on GitHub
  * `ionic-gib`: https://github.com/wraiford/ibgib/tree/v0.2.729/ionic-gib
  * "pre-refactored" = doesn't use this core-gib lib, but rather is the
    springboard/"carcass" for it.
* base ibgib protocol graphing substrate lib on GitLab
  * `ts-gib`: https://gitlab.com/ibgib/ts-gib

I'm pulling out behavior from the
[ionic-gib](https://github.com/wraiford/ibgib/tree/v0.2.729/ionic-gib) project
into this lib.

# helper-gib - shared, utils, common, respec testing framework and more

This library contains shared helper members (mostly functions) (a.k.a. "utils",
"shared", "common", etc.) that are not necessarily directly ibgib-related but
that are useful with ibgib in mind and thus consumed in multiple ibgib libs.

This also contains "respec-gib" (for now anyway until I break it out at a later
time mayhap), which is a relatively simple testing harness for ES modules only.

## respec-gib

it's similar to other unit testing frameworks, but way less complicated, way
better jargon, and way more respecful. In the future, it would probably be best
to allow customizable jargon. Anyway, here is the deets.

NOTE: It only works in node atow, but I will be adding a simple server for
executing in a browser environment as well.

### "config"

In lieu of a config file, right now it configures execution via a script file, currently
at [respec-gib.node.mjs](./src/respec-gib.node.mts). This file does two basic things:

1. locates respec files containing respecful specs
2. executes those respecs

atow this execution occurs via an esm dynamic `import` call for each respec path.

#### politely equal

When you go to create your `foo.respec.mts` file (or however you end up naming
it), at the very top you should import and set a respecful title:

```typescript
import { respecfully, iReckon, ifWe, firstOfAll, firstOfEach } from '@ibgib/helper-gib/dist/respec-gib/respec-gib.mjs';
const maam = `[${import.meta.url}]`, sir = maam;
```

You can include whatever **respecful** pronoun you want here. Then, you use this
throughout [taken from respec-gib.respec.mts](./src/respec-gib/respec-gib.respec.mts):

```typescript
await respecfully(sir, 'firstOfAll only', async () => {
    let firstOfAllTriggered = false;

    firstOfAll(sir, async () => {
        firstOfAllTriggered = true;
    });

    await ifWe(sir, `do an ifWe block, firstOfAll should've triggered`, async () => {
        iReckon(sir, firstOfAllTriggered).isGonnaBeTrue();
    });
});
```
