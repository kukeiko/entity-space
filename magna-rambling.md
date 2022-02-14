# 2022-01-30

-   allow to specify explicit list of values for isValueTemplate(), inRangeTemplate() and inSetTemplate()
-   shorten project names of products example apps, e.g. "examples-products-apps-products-api" to "examples-products-api"

# 2022-01-29

-   rename "is-value" to "equals"?
-   i have a hunch that reduction and "open" criteria as a result of remapping criteria via templates is somehow connected

# 2022-01-27

-   can & should we move remapping code to the templates?

# 2022-01-23

-   issues from 2022-01-21 and before are documented in https://github.com/kukeiko/entity-space/issues/148 - with a few exceptions, namely those things that are already outdated

-   expandEntities() makes a dirty check to see if a proeprty is already expanded. how should we solve this?
    the reason we need this is to not expand a property by querying it that can't be loaded from API, e.g. in the products example,
    "BrandReview" can not be loaded on its own.

-   figure out if we need a greedy token parser algorithm after all. right now we don't because all criteria "start with a unique syntax", so to speak. update: in remapping.spec, i mentioned being able to parse templates as well. here we would need that to support "in-range" and "in-range:string". without greedy algorithm, we would have to have "in-range:\*"

-   should expansions also allow for expanding primitives? would be nice, as this is what GraphQL allows for

-   simplify code @ in-range - it seems a bit too complicated. we might want to create two new criteria to help here: bigger & smaller (or greater & lesser). however, we would then (i think for the first time) have multiple ways to express the same criteria identity. that needs to be taken into account, especially when remapping. if a user wants to map to inRange(), and there only is greater() - it should remap to it. it should also remap or(greater(), lesser()) to inRange().

-   enable intellisense when creating EntitySchemas, e.g. on "addProperty(key: string)" i want "key" to be a list of suggestions.

-   consider making the criteria & criteria-template "ctor" methods uppercase. might be more intuitive.

-   clean up imports - i did a lot of auto imports everywhere, so im sure there are quite a lot of dirty ones

# 2022-01-21

-   while writing example controllers, I find myself having to make POST methods just to receive expansion.
    would be nice if we can use GET as well

# 2022-01-20

-   mergeQuery(a, b) tried to both merge & widen - to make things simpler to graps (and have simpler code),
    i want to do widenQuery() as a separate call.

-   implement NamedCriteria.invert() so we can have "createQueriesFromEntities()" in workspace. currently the workspace specs fail
    if i add "createQueriesFromEntities()" because it is not implemented

-   maybe i've written it down here already, but just to make sure: don't forget about the case where a component might issue a query
    for which there is no actual API endpoint. the query might make sense against workspace cache, but not against API.
    i am a bit puzzled here.

-   document somewhere the main feature entity-space should allow for: querying data in any position in any deeply-nested component,
    and just getting the data. doesn't matter if from API, cache, or if in a workspace where entities are actively edited and then later committed.

# 2022-01-19

-   by creating queries from payload to allow expand() to not explicitly use "queryAgainstCache()", we might create queries
    that can not be resolved by an API. so any component that then makes such a query relies that the data has been cached already.

-   normalizeEntities() only deals with relations, but what about relations on complex types? i seem to either have forgotten about them
    or thought "i'll do that later" and didn't document it (or maybe i did and i just dont find it right now)

# 2022-01-18 yaroslav introduction

## goal

bring you up to speed so we can combine our brains together to:

-   come up with new ideas
-   have different perspectives; especially for "is that something the user would need?", and "how would a user want to use it?"
-   implement stuff
-   drive you away from purely doing "chore" issues

## not goals

-   me telling you what to do
-   me losing freedom in refactoring like a mad person
-   you driving main implementation of things that i've earned to do after years of working on isolated components

## how to goal?

in my opinion we need to be on the same page, that means you knowing:

-   what is currently possible
-   what have i planned as the immediate next steps (aggregate data from multiple APIs + hydrate related data by contacting yet other APIs, blueprints as shared metadata between client + server)
-   what is my overall vision
-   how the current components play together
-   what parts of the codebase are dirty / to be majorly overhauled / somewhat stable

the issue is that:

-   from all the basic functionality i have in mind, only about 20% is implemented and stable (and that is mainly the criteria code)
-   pretty much nothing is documented
-   not all dirty places are marked w/ a [todo] comment
-   github issues have very minimal description that probably only i can make sense of
-   i still have things in my mind that are not documented anywhere

so the way i see it, i have to work on documenting stuff - both in code and on github.

but let's say i've shown you the current "products" example, told you a bit about my next steps and ideas,
and you have a better picture of things - we're probably still not on the same page until you know the codebase better.

therefore, how do you want to get to know it better?

-   immediately implement something?
-   try to create specs that fail and fix the implementation?
-   just browse around for a while?
-   make use of it as a library already? (right now difficult because a lot of stuff still missing & buggy)
-   something entirely different?

whatever it is; it has to be something you're really motivated to do. i don't want to bring you on board as a supporter for grunt work (and you hopefully don't either), but as equals, and that will require quite some time & energy.

most importantly: don't wait to ask me anything at all, at any time!

also, one thing needs to be clear: i have no mercy when it comes to code style guidelines. if you make a PR for something,
expect me styling it up to my liking. i am of course open to suggestions to style & name things differently - but i absolutely
loathe if there is inconsistency (there already is btw, but all of that inconsistency shall be purged! hahaha)

## aggregate data from multiple services + hydrate related data:

-   contact multiple APIs to get the root aggregates
-   then contact other APIs to hydrate relations of those root aggregates

one such contacted API might be an entity-space API itself.

# 2022-01-16

super excited with the products example! it helped me find several query/criteria merging issues already, and gives me tons
of motivation to flesh out things. one of those things is actually not code, but github issues & projects.
i want to flush my ideas "to disk" so to speak and document all the things i want on github.

to help me do that, here is a loose list of things:

-   api-gateway support. have an api running that receives a query, opens up a temporary workspace, delegates
    calls to other services, collects entities into workspace, then queries workspace. i need to consider that
    any service node itself might be an entity-space api, so one could not know what part of a query it can resolve
    without first contacting it. i currently see two options: 1st send a describe request, and then act based on it,
    or do both things at once: open up a stream that will at some point tell you what data you can expect to receive
    (that is how i had it in the now deleted old query-translation/stream code)

-   expansion support (products-example)
    i should include expansion ASAP because im sure the merging/reduction has some bugs there. we could habe 1-n relationship
    from product to product-review. interesting here would also be if those reviews are to be loaded from api/products endpoint,
    or from a separate api/product-reviews endpoint - or both, depending on some yet-to-be-determined factor.

-   paging support: top, skip, orderBy
    absolutely necessary. should do ASAP.

-   schema properties: they're not really done at all
    the only thing we're using schemas for right now is getting key, indexes and relations. we should also now think about
    primitive properties, and validating entities against schemas

-   schema baking: bake schemas for better performance

-   entity reader: class to read values based on schema, e.g. reading key/index values - also absolutely do "baking", i.e. what i
    had in entity-space@0.6.8 already, compiling the "copyPrimitives" based on schema data to be stupidly fast.

-   adding/patching/deleting entities:
    user should be able to do CRUD on entities in workspace, and also persist those changes

-   workspace hierarchy
    you have a products list UI and then click on a product to open a modal, the workspace of the modal should inherit the
    workspace of the list. you can now do changes in the workspace of the modal without making changes to the list already.
    once user closes modal, apply changes to list workspace - or discard them very easily (just destroy modal workspace)

-   cache invalidation
    big topic where im not so sure yet on how we're gonna support that. we should be able to do interesting things though thanks
    to reduction mechanics.

-   union support
    either try to shove that into the products example, or start a new example, e.g. "shapes" (square, circle, triangle) with canvases which contain them.

-   schema composition via allOf/oneOf/anyOf
    i conveniently put that on the back-burner, but i really need to look into that. will be interesting to figure out how we'll store entities then.
    also the customer-id + country-id dilemma (i.e. introducing country-id later in development, but still having customer stores with just customerId being PK)
    problematic is something i want to touch here. => see notes from 2022-01-13 of this document, there i used a better example that doesnt leak PBS internals

-   blueprints: generate schemas based on blueprints, and make use of Instance type.

-   open-api: import & export from and to entity-space schemas

-   service-workers/worker-threads: ability to spawn service worker(s) to delegate the heavy lifting to them,
    e.g. filtering/expanding/normalizing entities, for that it is absolutely required that we can easily
    copy entities between service-worker and main-thread. also every other component
    needs to be easily serializable, e.g. queries, expansions, criteria, schemas, and more.

-   type safety through expansions
    that was my driving factor back in 2018 - i absolutely wanted a reference to not be null/void 0 when i included them in a query.
    what i want the user to be able to do as well is say "expand this reference, but if it fails, its ok"

-   query toString(): now that entity-schema is part of it, what will a compact toString() representation look like?
    cause the schema-id is a full blown URL, and that is loooong.

-   reduction visualization
    when implementing reduction cases i had some visuals in my mind to even be able to grasp how it has to work;
    it would be kickass to actually be able to render them somehow (html; and if possible, terminal support <3),
    that would make figuring out whats going on under the hood much easier

-   reactive queries/stores
    user should be able to set a query as reactive; so it'll auto update just like akita-js queries when any change to criteria/expansion/paging
    or even the entities themselves is done

-   cover more reduction/merge cases
    especially in the merge department i only implemented what i needed

-   query compaction (better term to be identified) - if a query is reduced to 10 single queries, you probably just want the 1 query instead.

-   render "is-value" as just the value: for that to work there needs to a possibly big change in the criteria-token-parsers,
    i think they would need to get greedy, but i faintly remember this being a problem w/ or/and criteria not requiring encompassing
    brackets. or something of the sort.

-   custom query options:
    criteria require that you have those values on the entities as properties. but that is not always possible,
    so we need to be able to have the user set some custom options - which might even need reduction & merging behaviour support.
    since those options are evaluated server-side, entities of such queries probably need to be put into different store buckets.

-   support dictionaries
    im pretty sure that is the only common data-modelling thing that we can't support yet. needs to work nicely w/ blueprints & expansion.

-   schema validate entity

-   schema createDefaultEntity() (allows us to add generic to schema for nice intellisense)

-   auto-generation of entities for testing purposes
    find some nice library that we could use to generate test data based on our schema metadata

-   "search" keywords support - doing criteria with inRange() / inSet() is easy, but we really need support for queries that
    just have a "searchText" field, and have that be representable via criteria (if possible). probably connected w/ the "custom query options" topic

-   inspire yaroslav by telling him that the reduction mechanics don't just allow for client-side-caching, but can possibly open a lot of doors!
    one of them api-gateway!

-   normalize non-related entities, i.e. entities that have no pk?

-   put criteria into separate package "@entity-space/criteria"?

-   consider using prime-ng instead: while they don't use ChangeDetection.OnPush like angular/material does;
    it does offer a huge variety of useful controls <3

# 2022-01-15

-   in the products example, changing min/max rating after changing min/max price results in a ton of queries.
    there is a new query for each change made to the rating. interesting!

# 2022-01-13

-   add vscode extensions i use to recommended list in repository
-   make a decision on how key index is treated. when i call "getIndexes()" - is it included or not?
-   idea: scenario to tackle issue that with having a primary key be composited later on in the app dev lifecycle. as an example we could have a "Human" entity with SSN being the key, and then later adding "countryId" to the key. we would have "Human" and "HumanOfCountry". "Human" as key still has just "SSN", but "HumanOfCountry" has key "SSN" + "countryId". that would mean that we need a "Human" store per countryId so keys are kept unique. so suddenly a newly added, from "Human" extending schema requires us to have multiple stores. so maybe we should always consider having multiple stores per type of entity somehow?
-   a relation between two entities should be able to exist without an index. an index is just a storage optimization - and, if unique is set to true - a constraint.
-   i prefixed schema implementations with "Unbaked", as i plan to bake them (i.e. validation + reading all properties, keys, and relations fromm allOf() derived schemas and adding them for performant lookup). but how would I, after baking, update references to unbaked schemas (to now point to the baked schema) that exist in components like EntityStore?

# 2022-01-12

open-api (and by proxy json-schema) allows for schema compositions that we can not cleanly map to the
relational structure between entities we want to support. i feel like that is a big point to make clear
to potential users.

# 2021-12-11

a property that needs to be expanded that has no link (i.e. something that lets us evaluate client-side how to join entities together)
can not be put into a separate store. it has to be stored directly on the entity.

# 2021-11-30

## client side db

time for client side database. want to have option to use indexeddb (not available in firefox when in private mode,
and also not available in node-js).

so we'll have our own in-memory db implementation and the indexeddb implementation, so we're gonna need an abstraction layer
to access both implementations in the same way.

we'll probably want to pass our Query to that database, and it will then figure out what its capable of and load the stuff it can.
so there is some criteria remapping, and some way to identify the type of model. i don't really have that yet except for
doing instanceof checks when using the model package.

the only reason (afair right now) we're using classes to model our entities is to support cyclic references, which is just not
possible otherwise (other libs that allow you to create types have that issue).

however, I want to try as much as I can to not force this way of modelling onto the user. we therefore have a reason
to define a metadata model that is not coupled to the model classes. that metadata would be the basis for the database
and for the open-api metadata document, and ofc for all other things.

if the user wants to use our model classes, then they can - they'll use them to create the metadata for which will provide a method.
if they don't want to use it they'll just define it themselves.

that metadata is then part of the core package, and our model package might need renaming. lets see.
=> idea: rename "model" to "blueprint"?

## paging

-   paging on a query can only be passed to a repository if that repository can fully evaluate given criteria.
    e.g. if we query ProductsRepository which does not support filtering by reviews, and we issue a ProductsQuery
    with "where Reviews.rating > 3", we'll have to load all the Products and all the Reviews, then filter in-memory.
    Or we catch that case specifically and load filtered Reviews join Products, then fetch the Products and hydrate
    filtered Reviews, then return that.

# 2021-11-28

i've just read up on how indexeddb works on mdn and found this regarding querying data from it:

```
// Match anything between "Bill" and "Donna", but not including "Donna"
var boundKeyRange = IDBKeyRange.bound("Bill", "Donna", false, true)
```

IDBKeyRange.bound is esentially our inRange() - and it looks like it uses the argument format that i just changed.
i should probably revert it back and generally change it so it fits what you see here https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#using_an_index
=> update: reverted the change, but still not 100% compatible argument list (need to get rid of "inclusive" being an array)

# 2021-11-21

-   nullable does not do anything yet @ new property.ts
-   "identifiedBy()" from old property missing

# 2021-11-14

-   might wanna use these inrange params instead of current: export function inRange(from?: number | [number, false], to?: number | [number, false]): InNumberRangeCriterion;

-   unintuitive thingy in 01-reduction.spec.ts:

    ```typescript
    const from_100_to_200 = inRange(100, 200);
    const from_100_to_300 = inRange(100, 300);

    // [todo] it would be much more intuitive to instead have:
    // const expected = inRange(201, 300)
    // which would be valid for integer fields
    const expected = inRange(200, 300, [false, true]);

    const difference = from_100_to_200.reduce(from_100_to_300);

    expect(difference).toEqual(expected);
    ```

-   without thinking i've written [1-7] a lot (instead of [1, 7]) - maybe good idea to switch to that notation?
    it would make it easier to pick out in-range criteria in a string where there's also in-set criteria

# 2021-11-14

-   try to fix "possibly infinite type recursion" error when commenting out the cast method @ criterion.ts
    => i believe its because CriterionTemplate can be "`Class<Criterion>`", so maybe its fixed if we implement a template class for each type of criterion
-   implement reductions between is-value & in-set

# 2021-09-07

## public / protected / private barrel files

when thinking about publishing, i want to have a small public api. but i also need the src/test folder to import from a barrel.
we could create 3 barrels:

-   public.ts: barrel for end user
-   protected.ts: barrel for package, other packages & src/test
-   private.ts: barrel for package only

# 2021-07-25

we could introduce something like "BakedCriteria":

-   ValueCriterion instances become mutable and methods like ValueCriterion.pick(SupportedValueCriterionType) will
    mutate the instance in place
-   there will be a way to "bake" instances so that they become immutable and "less" generic, i.e. if we bake an
    OrCombineValueCriteria we will have one where we know that it contains only InRangeCriteria
    (very sloppy description but i hope future me will remember what i was thinking)
