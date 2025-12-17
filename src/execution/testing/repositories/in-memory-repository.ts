import { Entity } from "@entity-space/elements";
import { jsonClone } from "@entity-space/utils";

export abstract class InMemoryRepository<T extends Record<string, Entity[]>, NoId extends keyof T = never> {
    protected entities: Partial<T> = {};

    useEntities(entities: Partial<T>): this {
        this.entities = { ...this.entities, ...structuredClone(entities) };
        return this;
    }

    protected filter<K extends keyof T>(
        entity: K,
        predicate?: (entity: T[K][number]) => boolean,
        pageSize?: number,
        page?: number,
    ): T[K] {
        let filtered = jsonClone((this.entities[entity] ?? []).filter(predicate ?? (() => true)));

        if (pageSize) {
            page = page ?? 0;
            const sliceFrom = pageSize * page;
            const sliceTo = pageSize * (page + 1);

            filtered = filtered.slice(sliceFrom, sliceTo);
        }

        return filtered as T[K];
    }

    protected nextId<K extends Exclude<keyof T, NoId>>(entity: K): number {
        const latest = (this.entities[entity] ?? []).sort((a, b) => {
            return +b.id - +a.id;
        });

        return (latest[0]?.id ?? 0) + 1;
    }
}
