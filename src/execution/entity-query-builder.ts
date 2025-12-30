import {
    constructEntity,
    Entity,
    EntityBlueprint,
    EntitySchema,
    PackedEntitySelection,
    SelectEntity,
    unpackSelection,
    WhereEntity,
} from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { lastValueFrom, map, Observable, Subject } from "rxjs";
import { QueryArguments, QueryArgumentsParameters, QueryCacheOptions } from "./execution-arguments.interface";

export class EntityQueryBuilder<T extends Entity = Entity, S extends PackedEntitySelection<T> = {}> {
    constructor(schema: EntitySchema, queryFn: (args: QueryArguments) => Observable<T[]>) {
        this.#schema = schema;
        this.#queryFn = queryFn;
    }

    readonly #schema: EntitySchema;
    readonly #queryFn: (args: QueryArguments) => Observable<T[]>;
    #selection: PackedEntitySelection<T> = {};
    #criteria: WhereEntity<T> = {};
    #parameters?: QueryArgumentsParameters;
    #cache: QueryCacheOptions | boolean = false;
    #indicate?: Subject<boolean>;

    select<E extends PackedEntitySelection<T>>(select: E | PackedEntitySelection<T>): EntityQueryBuilder<T, E> {
        this.#selection = select;
        return this as any;
    }

    where(criteria: WhereEntity<T>): this {
        this.#criteria = criteria;
        return this;
    }

    use<P>(blueprint: Class<P>, parameters: EntityBlueprint.Instance<P>): this {
        this.#parameters = { blueprint, value: parameters };
        return this;
    }

    cache(options: QueryCacheOptions | boolean): this {
        this.#cache = options;
        return this;
    }

    indicate(isLoading$: Subject<boolean>): this {
        this.#indicate = isLoading$;
        return this;
    }

    get$(): Observable<SelectEntity<T, S>[]> {
        return this.#queryFn(this.#toQueryArguments()) as Observable<SelectEntity<T, S>[]>;
    }

    get(): Promise<SelectEntity<T, S>[]> {
        return lastValueFrom(this.get$());
    }

    /**
     * @deprecated use {@link get$} instead
     */
    getTyped$(): Observable<SelectEntity<T, S>[]> {
        return this.get$() as Observable<SelectEntity<T, S>[]>;
    }

    /**
     * @deprecated use {@link get} instead
     */
    getTyped(): Promise<SelectEntity<T, S>[]> {
        return lastValueFrom(this.getTyped$());
    }

    getOne$(): Observable<SelectEntity<T, S>> {
        return this.#queryFn(this.#toQueryArguments()).pipe(
            map(entities => {
                if (!entities[0]) {
                    throw new Error(`${this.#schema.getName()} entity not found`);
                }

                return entities[0];
            }),
        ) as Observable<SelectEntity<T, S>>;
    }

    getOne(): Promise<SelectEntity<T, S>> {
        return lastValueFrom(this.getOne$());
    }

    /**
     * @deprecated use {@link getOne$} instead
     */
    getOneTyped$(): Observable<SelectEntity<T, S>> {
        return this.getOne$() as Observable<SelectEntity<T, S>>;
    }

    /**
     * @deprecated use {@link getOne} instead
     */
    getOneTyped(): Promise<SelectEntity<T, S>> {
        return lastValueFrom(this.getOneTyped$());
    }

    findOne$(): Observable<SelectEntity<T, S> | undefined> {
        return this.#queryFn(this.#toQueryArguments()).pipe(
            map(entities => {
                return entities[0];
            }),
        ) as Observable<SelectEntity<T, S> | undefined>;
    }

    findOne(): Promise<SelectEntity<T, S> | undefined> {
        return lastValueFrom(this.findOne$());
    }

    /**
     * @deprecated use {@link findOneTyped$} instead
     */
    findOneTyped$(): Observable<SelectEntity<T, S> | undefined> {
        return this.findOne$() as Observable<SelectEntity<T, S> | undefined>;
    }

    /**
     * @deprecated use {@link findOne} instead
     */
    findOneTyped(): Promise<SelectEntity<T, S> | undefined> {
        return lastValueFrom(this.findOneTyped$());
    }

    constructDefault(): SelectEntity<T, S> {
        return constructEntity(this.#schema, unpackSelection(this.#schema, this.#selection ?? {})) as any;
    }

    #toQueryArguments(): QueryArguments {
        return {
            schema: this.#schema,
            cache: this.#cache,
            parameters: this.#parameters,
            select: this.#selection,
            where: this.#criteria,
            isLoading$: this.#indicate,
        };
    }
}
