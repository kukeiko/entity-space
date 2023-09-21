import { IEntityStore } from "../entity/entity-store.interface";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { EntityQueryTracing } from "./entity-query-tracing";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";

// [todo] I think I want a name unrelated to the EntityWorkspace
export class EntitySpaceServices {
    constructor(private readonly catalog: EntitySchemaCatalog, private readonly tracing: EntityQueryTracing) {}

    private readonly database = new InMemoryEntityDatabase();
    private readonly sources: IEntityStreamInterceptor[] = [];
    private readonly hydrators: IEntityStreamInterceptor[] = [];
    private readonly stores: IEntityStore[] = [];

    getCatalog(): EntitySchemaCatalog {
        return this.catalog;
    }

    getTracing(): EntityQueryTracing {
        return this.tracing;
    }

    // getDatabase(): IEntityDatabase {
    getDatabase(): InMemoryEntityDatabase {
        return this.database;
    }

    pushSource(source: IEntityStreamInterceptor): this {
        this.sources.push(source);
        return this;
    }

    getSources(): IEntityStreamInterceptor[] {
        return this.sources.slice();
    }

    pushHydrator(source: IEntityStreamInterceptor): this {
        this.hydrators.push(source);
        return this;
    }

    getHydrators(): IEntityStreamInterceptor[] {
        return this.hydrators.slice();
    }

    pushStore(store: IEntityStore): this {
        this.stores.push(store);
        return this;
    }

    getStores(): IEntityStore[] {
        return this.stores.slice();
    }
}
