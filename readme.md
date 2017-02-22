# entity-space
entity-space is a data layer utility for TypeScript web applications.

it helps you with:
* caching data fetched from APIs
* unifying data loading logic
* abstracting multiple APIs into one interface

it is currently used in a customer-facing business web-application and as such is always pretty stable, receives constant updates, improvements
and is developed to be easy to use. introducing it into your project requires describing your cacheable entities in terms of their properties
and relations to other entities and telling entity-space how to execute data loading/saving queries.

whenever you then want to load data, it'll optimize your queries by either completely or partially loading from cache.

# documentation
proper API documentation will follow as soon as version reaches stable v1.0.0
