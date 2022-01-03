import { SchemaCatalog } from "./metadata/schema-catalog";

// [todo] not a fan of having the "shouldAddSelf" flag
export function normalizeEntities(
    model: string,
    items: any[],
    catalog: SchemaCatalog,
    shouldAddSelf = true
): Record<string, any[]> {
    const schema = catalog.getSchema(model);
    const normalized: Record<string, any[]> = {};

    if (shouldAddSelf) {
        normalized[model] = items;
    }

    for (const relation of schema.getRelations()) {
        const navigated: any[] = [];

        for (const item of items) {
            const value = item[relation.path];
            if (value == null) continue;

            if (Array.isArray(value)) {
                navigated.push(...value);
            } else {
                navigated.push(value);
            }

            // if (property.isExpandable()) {
            // delete item[property.name];
            delete item[relation.path];
            // }
        }

        const deeperNormalized = normalizeEntities(
            schema.getPropertyByPath(relation.path).getSchemaName(),
            navigated,
            catalog
        );

        for (const key in deeperNormalized) {
            normalized[key] = [...(normalized[key] ?? []), ...deeperNormalized[key]];
        }
    }

    return normalized;
}
