# feature roadmap / milestones:
- 0.5.0 service-cluster, abstract entities
- 0.?.0 debug output interface, cache invalidation, contexts, validation, query statistics

# todos
- reduce queries by expansions that are already cached
- merge equal pending queries
- remove "name" from property decorator arguments
- use custom decorator arguments instead of Partial<ICtorArgs>
- allow reference key convention => "template" => "templateId"
- decorators should bleed through from super classes, allowing inheritance
- support expansions @ workspace.remove()
- possibly introduce expansion pool to reduce memory footprint
- improve performance in various cache-checking places by using utlizing Expansin.equals()
