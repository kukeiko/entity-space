import { SchemaCatalog } from "./metadata/schema-catalog";
import { SchemaProperty } from "./metadata/schema-property";

// [todo] not a fan of having the "shouldAddSelf" flag
export function normalizeEntities(
    model: string,
    items: any[],
    catalog: SchemaCatalog,
    shouldAddSelf = true
): Record<string, any[]> {
    const schema = catalog.getSchema(model);
    const navigable = schema.getProperties().filter(SchemaProperty.isNavigable);
    const normalized: Record<string, any[]> = {};

    if (shouldAddSelf) {
        normalized[model] = items;
    }

    for (const property of navigable) {
        const navigated: any[] = [];

        for (const item of items) {
            const value = item[property.name];
            if (value == null) continue;

            if (Array.isArray(value)) {
                navigated.push(...value);
            } else {
                navigated.push(value);
            }

            if (property.isExpandable()) {
                delete item[property.name];
            }
        }

        const deeperNormalized = normalizeEntities(property.model, navigated, catalog, property.isExpandable());

        for (const key in deeperNormalized) {
            normalized[key] = [...(normalized[key] ?? []), ...deeperNormalized[key]];
        }
    }

    return normalized;
}