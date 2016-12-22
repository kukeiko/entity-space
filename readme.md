# purpose
you need a client-side data storage that helps you with caching relational entities to minimize calls to remote APIs

# functionality
* usage of entity queries to describe which entities including which relations should be loaded
* load data from cache by executing a query against it
* easily determine if a query is a superset/subset of an already executed query and thus load from cache instead

# what you need to do
* create metadata for your entities
* transform entity queries into API calls
    * very easy if you're consuming an OData service
