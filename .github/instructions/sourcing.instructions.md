---
description: Read this whenever you need to understand sources, which load entities.
---

# Sourcing

Sources are registered with `EntityServiceContainer.for(blueprint).addSource(...)`. A source callback loads one entity or an array of entities, synchronously or asynchronously. The application implements the actual data access.

When adding a source, declare the capabilities it supports:

- `select`: properties and relations the source can return.
- `where`: criteria shape the source can handle.
- `parameters`: an optional blueprint for extra query parameters.
- `sortable`: properties the source can sort by.
- `paging`: whether the source supports paging, and whether paging is required for it to accept a query.

Paging can only be declared together with a non-empty `sortable` selection. A source may be combined with other sources when more than one is needed to handle the query's criteria or selection.

## Callback arguments

The `load` callback receives:

- `query`: the entity query being dispatched.
- `selection`: the requested selection reshaped to the source's declared selection.
- `criteria`: the supported criteria for this dispatch, expressed using the declared `where` shape.
- `parameters`: the query parameter value, or an empty object when none was supplied.
- `sort` and `page`: supported sort/page details when present.

The callback should inspect the selection and implement the requested data access accordingly. It may return one entity or an array; its results are checked against the entity schema, and invalid entities are discarded.

## Selection and filtering

A source's selection declares what it can provide, and the callback is expected to return the selection passed to it. Runtime validation currently checks results against the entity schema rather than enforcing completeness against the callback selection. Registered hydrators may fill missing query data as a fallback. After hydration, query results that still do not satisfy the overall requested selection are excluded. Do not treat hydration fallback as the source contract.

Criteria that a source cannot handle may be evaluated by the library after sourcing, using the available entity data. Sources should apply the criteria they are given; do not assume every part of a query's criteria is sent to every source.

## Sorting and paging

Declare `sortable` only for properties the source can sort by. Paging requires `sortable`; use the paging option's `required` flag when the source cannot serve the query without a page. The library can reshape query work around source capabilities, so callback arguments may represent only the supported portion of the original query.
