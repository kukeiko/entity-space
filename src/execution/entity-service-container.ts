import { EntitySchema, EntitySchemaCatalog } from "@entity-space/elements";
import { Class, mutateMapEntry } from "@entity-space/utils";
import { EntityCache } from "./cache/entity-cache";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntitySchemaScopedServiceContainer } from "./entity-schema-scoped-service-container";
import { ExplicitEntityHydrator } from "./hydration/explicit-entity-hydrator";
import { EntityMutator } from "./mutation/entity-mutator";
import { EntitySource } from "./sourcing/entity-source";

export class EntityServiceContainer {
    readonly #tracing = new EntityQueryTracing();
    readonly #catalog = new EntitySchemaCatalog();
    readonly #sources = new Map<string, EntitySource[]>();
    readonly #explicitHydrators = new Map<string, ExplicitEntityHydrator[]>();
    readonly #mutators = new Map<string, EntityMutator[]>();
    readonly #caches = new Map<unknown, EntityCache>();

    getTracing(): EntityQueryTracing {
        return this.#tracing;
    }

    getCatalog(): EntitySchemaCatalog {
        return this.#catalog;
    }

    getSourcesFor(schema: EntitySchema): EntitySource[] {
        return this.#sources.get(schema.getName()) ?? [];
    }

    getExplicitHydratorsFor(schema: EntitySchema): ExplicitEntityHydrator[] {
        return this.#explicitHydrators.get(schema.getName()) ?? [];
    }

    getMutatorsFor(schema: EntitySchema): EntityMutator[] {
        return this.#mutators.get(schema.getName()) ?? [];
    }

    for<B>(blueprint: Class<B>): EntitySchemaScopedServiceContainer<B> {
        const schema = this.#catalog.getSchemaByBlueprint(blueprint);

        const addSource = (source: EntitySource) => {
            mutateMapEntry(this.#sources, schema.getName(), sources => sources.push(source), []);
        };

        const addHydrator = (hydrator: ExplicitEntityHydrator) => {
            mutateMapEntry(this.#explicitHydrators, schema.getName(), hydrators => hydrators.push(hydrator), []);
        };

        const addMutator = (mutator: EntityMutator) => {
            mutateMapEntry(this.#mutators, schema.getName(), mutators => mutators.push(mutator), []);
        };

        return new EntitySchemaScopedServiceContainer<B>(this, schema, addSource, addHydrator, addMutator);
    }

    getOrCreateCacheBucket(key: unknown): EntityCache {
        let cache = this.#caches.get(key);

        if (!cache) {
            cache = new EntityCache();
            this.#caches.set(key, cache);
        }

        return cache;
    }

    destroyCache(key: unknown): void {
        this.#caches.delete(key);
    }
}
