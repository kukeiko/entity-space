# rewrite "don't forget me" notes
- should metadata of a property point to other properties directly or just contain the key?
- try if we can have the "changedBy", "createdBy" metadata separated out
- query identities (All, ByIds, ByIndexes) are just filters (all => empty filter) - handle them internally as such?
- properly structure all variants of Locals (e.g. Id is not a Simple, how to to Computed/Composited/Etheral/Unique etc)
- instance type is quite unreadable, break into parts if possible

# feature ideas
## enable type-safe mapping
a developer should be able to create a mapper with a method signature that ensures the data given to it
contains the properties & references the mapper needs.

## support for selecting locals
if we're gonna go with supporting the partial loading of an entity (i.e. selecting only a specific set of properties)
we'll need to implement some new reduction logic.

## workspace hierarchy
workspaces could have a hierarchy (similar to what LightSwitch had): a query executed against a child workspace would first be reduced by the parent workspace before executing it.
- spawn a new workspace when opening an editor (e.g. Album editor)
    - cancel modal => kill workspace
- "album editor" workspace would inherit from "album overview" workspace

## complex type expansion
support expanding on complex types (e.g. loading actual entities nested in complex objects).

[example] an entity with a "Metadata" complex property, which includes the user that created
the record and the user that last changed it, so we'll need "Album/Metadata/{CreatedBy,LastUpdatedBy}"
where "Metadata" itself is not an entity which we could load by id.

```typescript
export interface User {
    id: number;
    name: string;
}

export interface Album {
    id: number;
    name: string;
    metadata: Album.Metadata;
}

export module Album {
    export interface Metadata {
        createdBy: User;
        updatedBy: User;
    }
}
```

## $top & $skip
$top & $skip query options would be really nice.

<!-- 
[todo] hydration state can possibly be completely deleted without salvaging any ideas from it

## hdyration state
would be stored @ $ metadata mentioned earlier
* allows reducing a hydration query
    * e.g. a page renders a list of components with loaded Entities A/B, but each list item requires A/{B,C}.
    because the dev is lazy, they didn't check for it - but that's okay, because each list item queries a hydration.
    each hydration query is first reduced, then the workspace collects those reduced hydration queries (by waiting for something like 10ms?) and forms a single query.
    if for some reason some list-items need deeper hydration, it won't be a single query, but very likely still less than n+1.

    * we can't be bothered to type out the return type of queries that include expansions.
    therefore, classes that do something with data and need certain hydrated expansions on those should just call "hydrate(expansion)" and continue processing.
    this requires that checking how deep something is hydrated has to be performant. -->
