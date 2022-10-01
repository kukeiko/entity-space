import {
    any,
    AnyCriterion,
    anyTemplate,
    Criterion,
    NamedCriteriaTemplate,
    or,
    orTemplate,
} from "@entity-space/criteria";
import { cloneJson, walkPath } from "@entity-space/utils";
import { ExpansionValue } from "../expansion";
import { Expansion } from "../expansion/expansion";
import { Query } from "../query/query";
import { IEntitySchema, IEntitySchemaRelation } from "../schema/schema.interface";
import { EntitySet } from "./data-structures";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { createDefaultExpansion } from "./functions";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { createQueriesFromEntities } from "./functions/create-queries-from-entities.fn";
import { joinEntities } from "./functions/join-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { EntityStore } from "./store/entity-store";

export class InMemoryEntityDatabase implements IEntitySource {
    private readonly stores = new Map<string, EntityStore>();

    async query(query: Query): Promise<false | EntitySet[]> {
        const result = this.querySync(query);

        return result ? [result] : result;
    }

    querySync<T = Entity>(query: Query): EntitySet<T> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        const criterion = this.withoutRetlationalCriteria(query.getCriteria(), query.getEntitySchema());
        let entities = store.getByCriterion(criterion) as T[];

        if (!query.getExpansion().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);
            this.expandEntities(query.getEntitySchema(), query.getExpansion(), entities);
            entities = query.getCriteria().filter(entities);
        }

        if (criterion instanceof AnyCriterion && !(query.getCriteria() instanceof AnyCriterion)) {
            // [todo] hotfix for non-related, but nested criteria
            entities = query.getCriteria().filter(entities);
        }

        return new EntitySet<T>({ query, entities });
    }

    // [todo] i think introduction of this broke workspace playground tests
    private withoutRetlationalCriteria(criterion: Criterion, schema: IEntitySchema): Criterion {
        const optionalDeepBag: Record<string, any> = {};

        schema.getIndexes().forEach(index => {
            index.getPath().forEach(path => (optionalDeepBag[path] = anyTemplate()));
        });

        const template = orTemplate(NamedCriteriaTemplate.fromDeepBags({}, optionalDeepBag));
        const remapped = template.remap(criterion);

        if (remapped === false) {
            return any();
        }

        return remapped.getCriteria().length === 1 ? remapped.getCriteria()[0] : or(remapped.getCriteria());
    }

    // [todo] not totally happy with this method also creating the queries from the entities,
    // but i wanted to prevent normalizing twice when adding entities, so that is why it is here
    // instead of in the workspace.
    addEntities(schema: IEntitySchema, entities: Entity[]): Query[] {
        entities = cloneJson(entities);
        const normalized = normalizeEntities(schema, entities);
        const createdQueries: Query[] = [];

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).add(normalizedEntities);

            if (normalizedEntities.length > 0) {
                const indexQueries = createQueriesFromEntities(schema, normalizedEntities);

                for (const indexQuery of indexQueries) {
                    createdQueries.push(indexQuery);
                }
            }
        }

        return createdQueries;
    }

    clear(): void {
        this.stores.clear();
    }

    private getOrCreateStore(schema: IEntitySchema): EntityStore {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            store = new EntityStore(schema);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }

    private expandEntities(schema: IEntitySchema, expansion: Expansion, entities: Entity[]): void {
        // [todo] dirty
        const isExpanded = (propertyKey: string): boolean => {
            const first = entities[0];

            if (first === void 0) return false;

            return first[propertyKey] !== void 0;
        };

        const expansionObject = expansion.getValue();

        for (const propertyKey in expansionObject) {
            const expansionValue = expansionObject[propertyKey];

            if (expansionValue === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            if (relation !== void 0 && !isExpanded(relation.getPropertyName())) {
                this.expandRelation(entities, relation, expansionValue === true ? void 0 : expansionValue);
            } else if (expansionValue !== true) {
                const property = schema.getProperty(propertyKey);
                const referencedItems: Entity[] = [];

                for (const entity of entities) {
                    const reference = walkPath<Entity>(propertyKey, entity);

                    if (Array.isArray(reference)) {
                        referencedItems.push(...reference);
                    } else if (reference) {
                        referencedItems.push(reference);
                    }
                }

                const entitySchema = property.getUnboxedEntitySchema();
                this.expandEntities(entitySchema, new Expansion(expansionValue), referencedItems);
            }
        }
    }

    private expandRelation(entities: Entity[], relation: IEntitySchemaRelation, expansion?: ExpansionValue): void {
        const relatedSchema = relation.getRelatedEntitySchema();
        // [todo] what about dictionaries?
        const isArray = relation.getProperty().getValueSchema().schemaType === "array";
        const fromIndex = relation.getFromIndex();
        const toIndex = relation.getToIndex();
        const criteria = createCriterionFromEntities(entities, fromIndex.getPath(), toIndex.getPath());
        const query = new Query(relatedSchema, criteria, expansion ?? createDefaultExpansion(relatedSchema));

        const result = this.querySync(query);

        joinEntities(
            entities,
            result.getEntities(),
            relation.getPropertyName(),
            fromIndex.getPath(),
            toIndex.getPath(),
            isArray
        );
    }
}
