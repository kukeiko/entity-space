import { Entity } from "@entity-space/elements";
import { compareValue, jsonClone, readPath, toPath } from "@entity-space/utils";
import { LoadEntitiesSort } from "../../sourcing/entity-source";

function sortEntities(entities: readonly Entity[], sort: LoadEntitiesSort[]): Entity[] {
    return entities.slice().sort((entityA, entityB) => {
        for (const property of sort) {
            const a = readPath(toPath(property.key), entityA);
            const b = readPath(toPath(property.key), entityB);
            const result = compareValue(a, b) * (property.ascending ? 1 : -1);

            if (result !== 0) {
                return result;
            }
        }

        return 0;
    });
}

export abstract class InMemoryRepository<T extends Record<string, Entity[]>, NoId extends keyof T = never> {
    protected entities: Partial<T> = {};

    useEntities(entities: Partial<T>): this {
        this.entities = { ...this.entities, ...structuredClone(entities) };
        return this;
    }

    protected filter<K extends keyof T>(
        entity: K,
        predicate?: (entity: T[K][number]) => boolean,
        from?: number,
        to?: number,
        sort?: LoadEntitiesSort[],
    ): T[K] {
        let filtered = jsonClone((this.entities[entity] ?? []).filter(predicate ?? (() => true)));

        if (sort) {
            filtered = sortEntities(filtered, sort);
        }

        from = from ?? 0;
        filtered = filtered.slice(from, to);

        return filtered as T[K];
    }

    protected nextId<K extends Exclude<keyof T, NoId>>(entity: K): number {
        const latest = (this.entities[entity] ?? []).sort((a, b) => {
            return +b.id - +a.id;
        });

        return (latest[0]?.id ?? 0) + 1;
    }
}
