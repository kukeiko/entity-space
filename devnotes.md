# feature roadmap / milestones:
- 0.7.0 ???
- 0.?.0 debug output interface, cache invalidation, contexts, validation, query statistics, indexedb support, abstract entities

# todos
## 0.6.0
- remove concrete query implementations and implement identities
    - same for query caches
    - @ service: single method for loading

## 0.7.0
- entity base class
    - static $ prop @ child class for useful stuff, like $.metadata
    - child class instance must implement $ getter for general access

## ???
- consider using strict null checks flag @ tsc
- remove inline property initializations if ctor initializes them safely
- allow reference key convention => "template" => "templateId"
- decorators should bleed through from super classes, allowing inheritance
- support expansions @ workspace.remove()
- possibly introduce expansion pool to reduce memory footprint
- improve performance in various cache-checking places by using Expansion.equals()
- reduce pending queries @ service-cluster: Foo(1), then Foo([1,2]) => should be reduced to Foo([2])

# test-todos
- write query-cache tests which state: "if isCached(q) returns true, reduce(q) must return null"
- write expansion test thats states that if A and B are equal, A must be a superset/subset of B and vice verse
- sourcemaps are broken due to coverage. right now its ok, since it actually helps (cause of the async generators and whatnot)
