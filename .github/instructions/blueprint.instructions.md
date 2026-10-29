---
description: Read this whenever you need to understand blueprints, which define the shape of an entity type.
---

# Blueprint

## Purpose and registration

A blueprint is a class that describes one entity type. Its declared properties become the entity schema used by query, hydration, and mutation operations. Register the class with `EntityBlueprint.register(...)` before using it. Registration can include:

- `name`: an alternate schema name (defaults to the class name)
- `sort`: a default entity sorter

A union schema can be defined from multiple registered blueprint classes.

Blueprint property helpers describe primitive properties and entity relations. Properties can also carry metadata such as Ids, arrays, Dto names, readonly/creatable status, uniqueness, discriminators, nullability, and optionality.

## Optionality

- Joined relations are optional.
- Embedded relations may be optional.
- Primitive properties may be optional.
- Ids are declared as readonly Id properties and cannot be marked optional through the blueprint Id helper.
- Optional and nullable are distinct: optional means the property may be absent; nullable means its value may be `null`.

## Relationships

- An embedded relation is a nested value on the owning entity, like a primitive property with a complex schema. It does not have join paths.
- A joined relation names a related entity schema and declares `from`/`to` join paths. Its target schema must have an Id. The execution layer can use those paths for automatic hydration and relation-aware mutations.
- The current auto-hydration implementation handles joined relations, not embedded relations. Whether this is the final design for the distinction is undecided; document current behavior separately from future intent.

Both kinds of relation can be arrays. Embedded relations can be optional and/or nullable. Joined relations are optional and can be nullable.

## Computed properties

`EntityBlueprint.computed(...)` registers a selection to compute, its required selection, and a function that computes it. Blueprint registration must happen first.

The schema builder records computed-property metadata, and the service container exposes `addComputedHydratorsFromSchemas()`. There is currently no call site for that method in the repository, so do not assume computed definitions are automatically wired into query hydration without verifying the integration.
