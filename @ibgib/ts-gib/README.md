# ibgib

This is the lowest level primitives of the ibgib protocol, written in
TypeScript. This is responsible for creating quantum ibgib frames based on
existing ibgib, growing cryptographically strong graphs - but in a unique way
when compared to other approaches.

## data structure: `ib`, `gib`, `data`, `rel8ns`

Each ibgib can be thought of both as an individual node in a Merkle DAG, and as
a stream through time with those individual nodes as reified discrete quanta in
time.

Each quantum node has up to four fields, and each field in one word:

* `ib` - metadata
* `gib` - checksum
* `data` - internals
* `rel8ns` - externals

This is extremely terse and naive of course. Here are slight more fleshed out
descriptions of each field.

* `ib`
  * data and metadata
  * contains simple, core data you want to see _without loading the entire datum into memory_.
    * Especially important when viewing only a linked relationship ib^gib address.
* `gib`
  * metadata
  * for complex data, this is the hash of the datum's other three fields
    * so for

    ```json
    {
        "ib": "bob",
        "data": {
          "bday": "1/1/1"
        },
        "rel8ns": {
          "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"]
        }
    }
    ```

    , the gib could be the hash of the concatenated hashes of the `ib`, `data` and `rel8ns`, e.g. `hash(hash(ib)+hash(data)+hash(rel8ns))
  * for primitives (e.g. '7' or '"some string"'), implied 'gib' value
    * so if you see 'test^gib', this implies { ib: test, gib: falsy or 'gib', data: falsy, rel8ns: falsy }
* `data`
  * intrinsic 'simple' primitive data.
    * e.g. `data: { name: "arthur", age: 42 }`
  * You can nest primitive-ish data objects, depending on your use case.
* `rel8ns`
  * extrinsic 'complex' data
  * named lists of merkle pointers to other content addressable ibgibs via their `ib^gib` addresses.
    * e.g. `"rel8ns": { "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"] }`
  * depending on type of rel8ns you're using, this can be ...
    * a single pointer like a linked list or blockchain style.
    * multiple pointers like a hash table.
  * these pointers are cryptographic merkle links to immutable frames
    but in practice often point to a timeline of a mutable ibgib entity.

Here is more detailed information about these fields.

### `ib`

The `ib` is for data and/or metadata that you want to be included in pointers
to the ibgib record. The entirety of this field will be used, in combination with
the `gib`, to uniquely identify an ibgib at a particular moment in "time". (Time
meaning the ibgib's own recorded mutations form a timeline, not necessarily wall time.)

In these examples, I'll give the `ib` and a corresponding possible `ib^gib` address
using gib placeholders like 'ABC123' which correspond to cryptographic hashes.

* simple
  * '[name]' or '[title]' or '[filename]'
    * 'bob' > 'bob^ABC123'
    * 'Life, The Universe, Everything' > 'Life, The Universe, Everything^DEF456'
    * 'foo.txt' > 'foo.txt^GHI789'
* more complex
  * '[name] [date]' or '[filename] [username]'
    * 'bob 1/1/2001' > 'bob 1/1/2001^XYZ321'
    * 'foo.txt bob' > 'foo.txt bob^DDD444'
* real world complex
  * 'tx [id] [token] [flag] [mask] [attempts]'
    * 'tx 123 JWThErE12x.y.z_no_spaces T 0110 1^AAA111'
    * 'tx 345 JWThErE12x.y.z_no_spaces T 0110 999^BBB284'
  * 'rx|[id]|[token]|[flag]|[mask]|[retries-left]'
    * 'rx|321|JWT_we can have spaces now in the token..|0|0101|3'

**NOTHING IS HARD CODED IN THE BASE GRAPH LIB REGARDING SCHEMAS.**

With the ibgib protocol, you can have your version control specs on-chain.
One of these specs can be a canon/template/schema for the `ib` field, or you can keep the
structure of the ib off-chain (but lose the usefulness of on-chain-ness).
This includes how the ib is delimited. For example, I often space-delimit the ib's
various pieces, which themselves are underscore or hyphen delimited. Since
the ib is much like a filename, it is often convenient to consider which
characters are allowed in which OSes you will want to interop with.

### `gib`

For starters, you can simply think of this as the hash of the other three fields.
It provides integrity of the record by default, and helps in building out
ibgib's version of a Merkle DAG.

### `rel8ns`

The `rel8ns` is a mapping of relationships among ibgibs, in a very similar
manner to edges/links in a graph. It's not quite the same, because the
graph is NOT just a DAG (directed acyclic graph), but we'll get to that.

#### a note on `ib^gib` addresses

Ibgib has a content addressable design. This means that we create an
address that is directly (and deterministically) related to the content
of the data.

In many other content addressing systems, only the hash is used, with some
using hard-coded metadata tacked on post-hoc and hard-coded in source code.
Ibgibs however use the `ib` field plus a delimiter (`^` by default) and the
`gib`, often referred to just as its `ib^gib`.

_This allows for on-chain, use-case driven decisions for exactly what metadata to include with the addresses!_

I've found over the years of programming with this approach that this is
ludicrously useful for making decisions in functions, algorithms and workflows
without requiring the resources to fully load a datum.

#### `rel8ns` structure V1

So the `rel8ns` themselves have the structure of rel8n names to arrays of
`ib^gib` addresses.

```json
"rel8ns": {
  "[rel8nName]": ["ib^gib address", "ib^gib2", "ib^1ac45ff5631f4a98a2148e24abc534d3"], // <<< general form
  "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"],
  "ancestor": ["bob^gib"],
  "tjp": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"],
  "friend": ["alice^34a807c927d84068af2e8b1cd24b4cb8", "charlie^0b54e0760c54441285374125563ef672", ],
}
```

There are a couple special rel8n names here: `past`, `ancestor` and `tjp`.

#### `past` rel8n

Ibgib is largely an append-only system very much like other version control systems.
_(I often conceive it as a semantic version control system, not hyperoptimized for text)_
Whenever you add/remove/edit an ibgib's property (`ib`, `data` or `rel8ns`), you are
mutating that ibgib across "time". That timeline is defined in the ibgib's terms
as its past. This is like what some other systems call an audit log, or like the previous links
of a blockchain. But it isn't - not in ibgib's terms. It is much more appropriate to think of
the ibgib as an entity progressing through time, and the record is like an echo/metric/projection
of that entity in our data space(s).

_The data is never the ibgib though!_

So when we notice a change of the ibgib either intrinsically (its `data` field)
or extrinsically (via its `rel8ns` to other ibgibs), we record a new ibgib datum/frame/quantum
with those changed intrinsic/extrinsic attributes and link the record to the previous one
via the `past` rel8n, either by appending the previous to the current frame's `past`
rel8n (which costs more in terms of storage resources), or by replacing the
`past` array with the single `ib^gib` address of the previous incarnation.
If the former, then we are growing the record each time, which will cost us
more resources in terms of storage but will provide quicker access to previous
frames. If the latter, which is more a blockchain linked-list style, then we
inevitably use less storage because it's always just one address, but it will
cost more to traverse the linked list both in terms of memory and processing costs.

This tradeoff between rel8n style is not just with the `past` rel8n but can be
with any rel8n you desire per use case.

Append style (default):
```json
{
  "past": [""],
}
// mut8 or rel8 transform
{
  "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"],
}
// mut8 or rel8 transform
{
  "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY", "bob^070e3fc9aab34f4ba1090f9519d9676a"],
}
// mut8 or rel8 transform
{
  "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY", "bob^070e3fc9aab34f4ba1090f9519d9676a", "bob^e556d72ace93428a98d222c960135e29"],
}
```

See how it keeps growing? That will cost us in the long run in storage if we expect a lot of records.

Linked style (via `linkedRel8ns` parameter):

```json
{
  "past": [""],
}
// mut8 or rel8 transform
{
  "past": ["bob^OLDHASH123456HOOGLEDYBOOGLEDY"],
}
// mut8 or rel8 transform
{
  "past": ["bob^070e3fc9aab34f4ba1090f9519d9676a"],
}
// mut8 or rel8 transform
{
  "past": ["bob^e556d72ace93428a98d222c960135e29"],
}
```

In this case, we simply have a single rel8n to only the previous frame of the ibgib's existence,
much like a linked list or a blockchain. This will save in terms of storage, but we
will need to load each previous record in order to get the prior one. To combat this,
and for many other reasons, the `tjp` rel8n is required which is a pointer to the
very first unique address of the ibgib. But first, the `ancestor` rel8n.

#### `ancestor` rel8n

Creating "new" ibgibs is actually a process of `fork`-ing existing ones, with
theoretically something "brand new" being a fork of the root ibgib
(with the actual address of `ib^gib`). When we perform this `fork` transform
(we'll get to that), we will clear out the `past` rel8n and add the source
ibgib to the `ancestor` rel8n.

_NOTE: If we're forking from the root, we'll leave `ancestor` empty just to save space, but whenever you see an empty array, it's always populated with at least `ib^gib`!_

So while an ibgib mutating intrinsically (via `mut8` transform) or extrinsically (via `rel8` transform) will append to its
`past` rel8n, a `fork` transform will clear the `past` and append to the `ancestor` rel8n. (This ain't your
grandpa's blockchain!)

#### `tjp` rel8n

Have you ever seen Back to the Future II? Do you remember the scene where Biff steals the Delorean
and goes back to 1955 - **the same point in time Marty went back to in Back to the Future I!!!**

Doc Brown calls that the Temporal Junction Point (or maybe it's just a coincidence). So that's what
I've called it. But that is extremely long to write, and it's so important that the terse `tjp` is
acceptable (I usually vehemently eschew variable names so short, if you don't mind a few $5 words).

So it turns out that this is **extremely** important. When you want to refer to an instance in time
for an ibgib, then you can refer to its `ib^gib` address. But when you want to refer to the _timeline_
of an ibgib, then you refer to its temporal junction point (`tjp`). This is used, for example,
in tracking the latest version of an ibgib. Also for subscribing to changes to an ibgib.

#### `dna` rel8n

If you choose, you can capture not only the ibgib frames in the ibgib timeline, but also the
"code" that was used to create each proceeding frame.

See the following section on transforms for more info.

### `data`

This is where you "link" to intrinsic, usually primitive data. For example, say you had

```json
"data": {
  "name": "Bob",
  "favoriteNumber": 42,
}
```

You could think of both "Bob" and 42 as being "Bob"^gib and 42^gib, so these indeed are
"rel8ns" to these primitives similar to the `rel8ns` property.

But for the most part, it's easiest to just think of the `data` as containing the
"actual" reified, simple data payloads.

## transforms

The three primary low-level transforms are: `fork`, `mut8` and `rel8`.

Each is encapsulated in an ibgib record of its own, and if you choose to track the
transform, its transform `ib^gib` address will be related to the newly created ibgib
via the special `dna` rel8n name.

For those familiar with event sourcing, this is quite similar to memo-izing both
the events and the aggregate values. The primary proximal benefit of this design however,
beyond those we get from the ibgib architecture in general, is that unlike with
event sourcing, we can apply this dna not only to rehydrate to produce the same
output, but to reapply to a different ibGib (or the same ibgib in a different space)
specifically to produce _different_ output.

Think applying diffs to different branches during merges...but instead of only
working in the text level, we're working at the semantic level!

_(We can optimize for storage through other methods such as compression of less used ibgibs...it's relatively easy to index them since we're using content addressing to begin with.)_

### `fork` transform

When we `fork` an ibgib A, we create a "new" ibgib B. This clears out `B.rel8ns.past`
and appends A's address to `B.rel8ns.ancestor` (remember all hashes are just made up here):

```
// source A that we will `fork`
{
  "ib": "A",
  "gib": "ed4ce4c485b84bdb95c59affbefc138e",
  "rel8ns": {
    "past": ["A^fbb1369596684e61ad093f33486ed615, A^7464b055d8524b638818aabab078e146, A^a96e9afc41c04245ad02036f7c1f7b53],
    "ancestor": [], // implied "ib^gib", but not too important :-0
    "dna": []
  },
  "data": {
    "foo": "bar",
    "bar": "bazzz"
  }
}

// transform T
{
  "ib": "fork",
  "gib": "bebbe34768434d909fc1ca3ab47c0b9f",
  "data": {
    "type": "fork",
    "srcAddr": "A^ed4ce4c485b84bdb95c59affbefc138e",
    "destIb": "B",
    "dna": true,
    ...
  },
  "rel8ns": {
    "ancestor": ["fork^gib"] // ancestry often acts as a "type" hierarchy
    ...
  }
}

// output B produced by the `fork`
{
  "ib": "B", // new ib
  "gib": "f94448aa676d4d398241b80575c8e31e",
  "rel8ns": {
    "past": [], // cleared
    "ancestor": ["a^ed4ce4c485b84bdb95c59affbefc138e"], // added source address
    "dna": ["fork^bebbe34768434d909fc1ca3ab47c0b9f"]
  },
  "data": { // same data
    "foo": "bar",
    "bar": "bazzz"
  }
}
// output B
```

In this example, we `fork` with source A (A^ed4ce4c485b84bdb95c59affbefc138e), with
`fork` transform T (fork^bebbe34768434d909fc1ca3ab47c0b9f), specifying a new ib "B" (`T.data.destIb`),
and it produced the "new" B with a cleared `B.rel8ns.past`. We didn't _have_ to give it a new
ib, that's just to point out that these are two distinct timelines.

_The hierarchy via `ancestor` is also its own kind of "timeline", but that's for another time._

### `mut8` transform

### `rel8` transform

## so what

### v bitcoin

nothing.

But if that's not exciting enough for you, ibgib was developed for distributed
computation apart from the bitcoin world. Here are just some of the design decision
differences:

* consensus is off-chain (or rather on-chain in git which itself is another Merkle DAG)
* PoW is hard-coded
  * thus PoW is naive (in the computation sense), since it requires huge effort to recode/move to some other proof.
* the source code is not part of the blockchain
  * so it's open src, and it's open data, but the src and data live in silos.
* centralized in the source code.
  * you're at the mercy of their coders to write the one chain to rule them all.
* these lead to consequences that make things like data projection & replication
  extremely non-trivial, let alone MANY other opportunity costs with technical debt.

What's good about bitcoin? Well it's awesome and still in wide use across the globe.
PoW was extremely novel and cool.

### v permissioned blockchains/DLTs

Basically, people are taking the blockchain/distributed ledger paradigm and trying
to apply it to other forms of distributed computing. without exception, each of these
starts by writing source code that is stored in a separate distributed ledger (called
git or [insert vcs here]) with no plan on dogfooding the source code back into the
process. Now you have to write and maintain code for (at least) both your source code
and your data, whereas you should be able to reuse code analysis/replication/identity
tools in a streamlined fashion.

For example, if I write a view that presents data in a certain way, I might now use
that same view to look at other data (possibly the code for the view itself) with
little-to-no modification. And if I am a learner

...anyway, lotsa writing. I invariably seem to write these kinds of things to get
the brain going, but I digress...

## contributing

### to add unit tests (specs)

Add a file in the same folder as the one you want to test.
Copy the filename and add .spec just before the extension,
e.g. src/folder/file-here.ts -> src/folder/file-here.spec.ts

## questions

### what is an ibgib?

what isn't?

### no really...

Semi-structured (JSON) data structure which creates a DLT graph with directed,
non-directed, cyclic and acyclic qualities. Very much like a semantic version
control system on a graph substrate to "track" "things".

### attention and devil's advocate

Think of the dynamic between our brain's process of "attention" and
the possibility of "playing devil's advocate". Essentially, you can
either point your attention at some "thing" where you think of
extending that same thing over time, or you can think of "splitting"
that thing and considering the result to be some "new" thing.

But each of these actions (and other permutations and actions not listed)
itself can be one of those "things". So you can devolve and never extend
anything, where everything is essentially meaningless. Or you can
go the other way and say how everything is still the same (one) thing.

But we experience time as a combination of these two options, always with
the ability to use our own attention to increase the sameness or
different-ness of any thing.

### semantic version control system

Computer people usually think of version control systems like
git, OpenCVS, subversion, etc. These usually borrow jargon from
the evolution of a river or a plant through time, e.g. branching,
forking, root. But these were developed with source control specifically
in mind, and they have been hyper-optimized for dealing with text.
Git has added on non-textual functionality, but it was an afterthought.

ibgib has been made as a self-referencing, bootstrapping semantic
version control system, and more fundamentally, the protocol that
underlies this system. By this, all configuration, source code,
issue tracking, etc., can be stored _inside_ the ibgib data
structures and using ibgib nodal exchanges.

You can think of the data structure as a Directed Acyclic Graph (DAG),
but this is only at the physical level **and does not capture
the cyclic nature of the ability for ibgibs over time to be
self-referencing** _(and self-negating and other self-thingies)_.

Two of the big focus points are:
1) Each datum is from some perspective, i.e. it's a belief held by an identity.
2) Each datum has context where it is "true" and where it is "false", which actually
defines what these terms mean.

Truth/falseness is determined by the attention on a thing, i.e. wherever
the ibgibs that continue to evolve and persist, those are said to be
"true within that context". Each context itself can be an ibgib, and
this framework provides an addressing scheme/space for this process of attention
that streamlines interaction between microservices/systems, ais, humans,
multi-human organizations, etc. It also does a lot of other stuff.

Ibgibs are also mobile, and can move among contexts proactively,
in addition to the contexts themselves changing over time.

### goedelian numbers counting to infinity

For the even more abstract out there (can't imagine many here on Earth): Each ibgib
datum is a goedelian number. The `ib^gib` (content) address ends up being this number,
and what we are actually doing is counting through time to infinity. But things
"at" infinity act differently than in the finite world.

When you "add" a number, the number was already there from some other context. This
stems from the existence of one infinity not only implies but requires _all infinities_
"to exist". But we experience this process over time. So it also requires that
_all infinities_ "do NOT exist".

Remember the aforementioned attention? This is where we resolve the issue of seemingly
self-negating statements, e.g., "This statement is false." If you think of this naively
with the dead concept of true/false, then you run into a problem. Most scientists and
mathematicians dislike this, just as they dislike most quantum outcomes - a feeling
which manifests itself as these effects being "weird". But back to the attention.

"Both" pathways through a self-negating statement are "true" in some context,
and as such when you are also in "that" context, you will attend to that pathway.
You will provide more time to it _within you yourself as a context_.

Just as you have competing thoughts and emotions (terms which are much more
easily understood with the concept of ibgib) within yourself which can seem to be
diametrically opposed, so any statement can be. This can lead to understanding the
difficulties with current friction between, e.g., pure and applied mathematicians.
Context for "proofs" is absolutely paramount: Under this condition X,Y,Z using these
axioms, etc. But neither axioms, nor their corollaries or proofs, are "true"
absolutely. If you agree with this, then it is true within your context. On down
the road of your life, when you disagree with this, it is false within your context.
Etc...

Enough typing for now, back to coding. Feel free (future and past beings), jump in with
your isomorphic ibgib engines in the chat, or email me at bill.mybiz@gmail.com .

## testing

### importmaps - `npm run test:browser` fails

as a workaround for bleeding edge ES module consumption (let alone testing
frameworks for them), I have kluged a workaround by editing
`/node_modules/jasmine-browser-runner/run.html.ejs` to include an import map
section. So atow paste the following code before any other `script` tags in the
`head` section.  (the versions may need to change):


_note: atow I am copy/pasting this text whenever I reinstall `node_modules` folder._

_note: if you are having CORS issues, it may be due to the cdn being down._


using **unpkg**:

```html
  <script type="importmap">
    {
      "imports": {
        "@ibgib/helper-gib": "https://unpkg.com/@ibgib/helper-gib@0.0.4/dist/index.mjs",
        "@ibgib/helper-gib/": "https://unpkg.com/@ibgib/helper-gib@0.0.4/"
      }
    }
  </script>
```

**using jsdelivr.net**:

```html
  <script type="importmap">
    {
      "imports": {
        "@ibgib/helper-gib": "https://cdn.jsdelivr.net/npm/@ibgib/helper-gib@0.0.4/dist/index.mjs",
        "@ibgib/helper-gib/": "https://cdn.jsdelivr.net/npm/@ibgib/helper-gib@0.0.4/"
      }
    }
  </script>
```
