---
description: Read this whenever you need to understand hydrators, which hydrate entities.
---

# Hydration

Hydration fills selected properties or relations that are missing from entities. It can happen as part of a query or be requested directly through `workspace.for(blueprint).select(...).hydrate(entities)`.

Register an explicit hydrator with `EntityServiceContainer.for(blueprint).addHydrator(...)`. Declare:

- `select`: the properties/relations the callback hydrates.
- `requires`: the selection that must already be available before the callback can run.
- `parameters`: an optional parameter blueprint. A query's parameter schema must match the hydrator's declaration.

The callback receives the entities, the accepted selection, an execution context, and parameters. It may mutate the entities synchronously or asynchronously. A hydrator can depend on data produced by another hydrator; the execution layer resolves compatible hydrators in stages.

## Automatic joined-relation hydration

The library has an auto-join hydrator for joined relations. It uses the relation's join paths to build a criterion for the related schema, then loads related entities through registered sources. The owning entities must have the join properties needed for this lookup. This is not the mechanism used for embedded relations, which are nested values expected to come from their owning entity's source or another explicit hydrator.

The current meaning of joined versus embedded is implemented as described above, but whether this distinction is the final design is undecided.

## Computed blueprint properties

Blueprints can register computed selections and their required selections. The schema builder records this metadata, but the repository currently has no call site for `addComputedHydratorsFromSchemas()`. Verify that computed hydration is wired in a particular setup before relying on it; do not assume a computed declaration alone makes it run.

## Parameters

Hydrator parameters are tied to the query's parameter blueprint. The parameter mechanism for hydration is still evolving; avoid assuming that auto-join hydration forwards query parameters to related source queries.
