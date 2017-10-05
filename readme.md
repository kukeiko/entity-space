# entity-space
entity-space is an attempt to create an abstraction layer between business and API logic,
simplyfing CRUD operations and providing a cache to reduce the number of HTTP requests made to consumed APIs.

# documentation
proper API documentation will follow as soon as version reaches stable v1.0.0

# features / goals
* unify data loading/saving logic
* cache data fetched from APIs
* abstract multiple APIs into a single interface

# requirements
* describe properties and relations of domain entities
* implement classes to handle CRUD HTTP requests
* use the in-built query system to execute CRUD operations

# goals
## 0.6.0
### filter criteria
ability to specify a query filter describing valid value ranges an entity should have (root level only, not navigations).

requires:
- proper reduction (as far as it makes sense) of 2 filters
- proper reduction of 2 queries with one or both of them having filters
- filtering arrays of entities


nice to have:
- helper to format filter into valid OData format

## 0.7.0+
### result, payload
intermediate object to improve loading/saving capabilities @ service-cluster.

- helps dealing with partial success / errors
- possibly a "live" result object that populates it with entities as they are loaded

### OData utils
required feature to make entity-space user-friendly.

- generate entity classes from metadata
    - ideally puts properties & decorators "in-place", so that users can keep their custom getters/setters etc.
    - a small app would be fantastic, since there might be a ton of options
- OData entity-service implementations
    - should be rich in features but thin in abstraction, so users are not forced to write workarounds
    - provides common loading/saving logic
    - query/filter/expansion toString() implementations

### debug utils
give users a way to see what is happening during the execution of a query.

### cache invalidation
more granularity in removing entities from the cache (instead of just by entity class).

### contexts
contexts are attached to a query and represent a filter on the entities & navigations that
can only be evaluated @ server.

the use case this feature stems from is an entity (which has a child collection of its own type, i.e. a tree)
that can be filtered by a boolan & date range value which we have no knowledge of or access to @ client.

### entity validation
would be nice to be able to validate an entity before trying to save it.

### query statistics
just because it would be interesting, but it also might help identify issues in the code.

### indexedDB support
wouldn't it be awesome to be able to replace the object-caches with an indexedDB?

the way i see it it can be done already, without having to shove around existing code too much.

### abstract entities
ability to transform/map entities into an abstraction of them.

### top & skip
ability to do offset load results - was high priority, but not soo much anymore due to filter critera.

### entity base class
controversial, since it would require users to extend from it, but it would help a lot with fetching
the metadata of an entity class.

- static $ prop @ child class for useful stuff, like $.metadata
- child class instance must implement $ getter for access via instance

### query merging
as of now, queries just reduce each other, but none are ever merged. would increase performance since
less query reductions would be made (especially if filters are used in order to page results).
