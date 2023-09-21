import { Class, DeepPartial } from "@entity-space/utils";
import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntitySet } from "../entity/data-structures/entity-set";
import { IEntityStore } from "../entity/entity-store.interface";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryBuilder, EntityQueryBuilderCreate } from "./entity-query-builder";
import { EntitySpaceServices } from "./entity-space-services";

export class EntityWorkspace implements IEntityStore {
    constructor(private readonly services: EntitySpaceServices) {
        this.store = services.getStores()[0]; // [todo] compatibility with music-box app
    }

    private store?: IEntityStore;

    private get catalog(): EntitySchemaCatalog {
        return this.services.getCatalog();
    }

    private get database(): InMemoryEntityDatabase {
        return this.services.getDatabase();
    }

    getContext(): EntitySpaceServices {
        return this.services;
    }

    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    // [todo] rename to upsert()?
    // [todo] we allow partials, but types don't reflect that (same @ cache and store)
    async add<T>(
        schema: Class<T>,
        entities: DeepPartial<EntityBlueprintInstance<T>>[] | DeepPartial<EntityBlueprintInstance<T>>
    ): Promise<void>;
    async add<T extends Entity = Entity>(
        schema: IEntitySchema,
        entities: DeepPartial<T>[] | DeepPartial<T>
    ): Promise<void>;
    async add(schema: IEntitySchema | Class, entities: Entity[] | Entity): Promise<void> {
        schema = this.toSchema(schema);
        // console.log("🆕 add entities", schema.getId(), JSON.stringify(entities));

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        if (!entities.length) {
            return;
        }

        await this.database.upsert(
            new EntitySet({
                // [todo] adding the overloads to support both schemas & blueprints caused having to add this "as Entity[]" assertion, no idea why
                query: this.queryTools.createIdQueryFromEntities(schema, entities as Entity[]),
                entities: entities as Entity[],
            })
        );
    }

    setStore(store: IEntityStore): void {
        this.store = store;
    }

    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: IEntityQuery): Promise<Entity[]> {
        return this.database.querySync(query).getEntities();
    }

    queryCache$(): Observable<IEntityQuery[]> {
        return this.database.getQueryCache$();
    }

    async create<T extends Entity>(entities: T[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.create(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        await this.database.upsert(
            new EntitySet({
                query: this.queryTools.createIdQueryFromEntities(schema, result),
                entities: result as T[],
            })
        );

        return result as T[];
    }

    async update<T extends Entity>(entities: DeepPartial<T>[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.update(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        await this.database.upsert(
            new EntitySet({
                query: this.queryTools.createIdQueryFromEntities(schema, entities),
                entities,
            })
        );

        return result as T[];
    }

    // [todo] copied over from (now deleted) ScopedEntityWorkspace, want to reuse for DX
    // oneById(id: number | string | Entity, hydrate?: UnpackedEntitySelection<T>): Observable<T | undefined> {
    //     let bag: Record<string, any>;
    //     const keyPaths = this.schema.getKey().getPaths();

    //     if (keyPaths.length > 1) {
    //         if (typeof id !== "object") {
    //             throw new Error("composite id expected");
    //         }

    //         bag = {};

    //         for (const path of keyPaths) {
    //             bag = writePath(path, bag, readPath(path, id));
    //         }
    //     } else {
    //         bag = writePath(keyPaths[0], {}, id);
    //     }

    //     const criterion = new EntityCriteriaTools().where(bag);

    //     return this.workspace
    //         .query$<T>(this.schema, criterion, EntitySelection.unpack(this.schema, hydrate ?? true))
    //         .pipe(map(entities => entities[0]));
    // }

    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    from<T extends Entity>(blueprint: Class<T>): EntityQueryBuilder<EntityBlueprintInstance<T>> {
        return new EntityQueryBuilder({ schema: this.catalog.resolve(blueprint), context: this.services });
    }

    fromSchema(schema: IEntitySchema): EntityQueryBuilder {
        return new EntityQueryBuilder({ schema, context: this.services });
    }

    protected getQueryBuilderCreate<T extends Entity = Entity>(schema: IEntitySchema<T>): EntityQueryBuilderCreate<T> {
        return {
            schema,
            context: this.services,
        };
    }

    private toSchema(schema: IEntitySchema | Class): IEntitySchema {
        if (!("getId" in schema)) {
            return this.catalog.resolve(schema);
        }

        return schema;
    }
}
