import { Entity, PackedEntitySelection, SelectEntity } from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { lastValueFrom, map, Observable } from "rxjs";
import { HydrateArguments, QueryCacheOptions } from "./execution-arguments.interface";

export class EntityHydrationBuilder<T extends Entity = Entity, S extends PackedEntitySelection<T> = {}> {
    constructor(blueprint: Class, hydrateFn: (args: HydrateArguments) => Observable<T[]>) {
        this.#blueprint = blueprint;
        this.#hydrateFn = hydrateFn;
    }

    readonly #blueprint: Class;
    readonly #hydrateFn: (args: HydrateArguments) => Observable<T[]>;
    #selection: PackedEntitySelection<T> = {};
    #cache: QueryCacheOptions | boolean = false;

    select<E extends PackedEntitySelection<T>>(select: E | PackedEntitySelection<T>): EntityHydrationBuilder<T, E> {
        this.#selection = select;
        return this as any;
    }

    cache(options: QueryCacheOptions | boolean): this {
        this.#cache = options;
        return this;
    }

    hydrate$<E extends T>(entities: E[]): Observable<E[]> {
        return this.#hydrateFn(this.#toHydrateArguments(entities)) as Observable<E[]>;
    }

    hydrate<E extends T>(entities: E[]): Promise<E[]> {
        return lastValueFrom(this.hydrate$(entities));
    }

    hydrateTyped$<E extends T>(entities: E[]): Observable<SelectEntity<E, S>[]> {
        return this.hydrate$(entities) as Observable<SelectEntity<E, S>[]>;
    }

    hydrateTyped<E extends T>(entities: E[]): Promise<SelectEntity<E, S>[]> {
        return lastValueFrom(this.hydrateTyped$(entities));
    }

    hydrateOne$<E extends T>(entity: E): Observable<E> {
        return this.#hydrateFn(this.#toHydrateArguments([entity])).pipe(map(entities => entities[0])) as Observable<E>;
    }

    hydrateOne<E extends T>(entity: E): Promise<E> {
        return lastValueFrom(this.hydrateOne$(entity));
    }

    hydrateOneTyped$<E extends T>(entity: E): Observable<SelectEntity<E, S>> {
        return this.hydrateOne$(entity) as Observable<SelectEntity<E, S>>;
    }

    hydrateOneTyped<E extends T>(entity: E): Promise<SelectEntity<E, S>> {
        return lastValueFrom(this.hydrateOneTyped$(entity));
    }

    #toHydrateArguments(entities: Entity[]): HydrateArguments {
        return {
            blueprint: this.#blueprint,
            cache: this.#cache,
            entities,
            select: this.#selection,
        };
    }
}
