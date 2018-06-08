import { TypeOf } from "../util";
import { getMetadata, AnyEntityType, EntityType, IEntity, AnyClassMetadata } from "../metadata";
import { Expansion, Query } from "../elements";
import { EntityMapper } from "../mapping";

export class QueryCache {
    private _queries = new Map<AnyEntityType, Query<any>[]>();

    isCached<T>(query: Query<T>): boolean {
        return this.reduce(query) == null;
    }

    merge<T>(query: Query<T>, payload?: any[]): void {
        this._merge(query);

        if (payload) {
            this._buildQueriesFromPayload({
                metadata: getMetadata(query.entityType),
                payload: payload,
                expand: query.expansions,
                isDto: true,
                skipRoot: query.identity.type == "ids"
            });
        }
    }

    reduce<T>(query: Query<T>): Query<T> {
        let queries = this._getQueries(query.entityType);
        let reduced = query;

        for (let i = 0; i < queries.length; ++i) {
            reduced = queries[i].reduce(reduced);
            if (!reduced) break;
        }

        return reduced;
    }

    clear(entityType?: EntityType<any>): void {
        if (entityType) {
            this._queries.delete(entityType);
        } else {
            this._queries.clear();
        }
    }

    private _getQueries<T>(entityType: TypeOf<T>): Query<T>[] {
        let queries = this._queries.get(entityType);

        if (!queries) {
            queries = [];
            this._queries.set(entityType, queries);
        }

        return queries;
    }

    private _merge<T>(query: Query<T>): void {
        let queries = this._getQueries(query.entityType);
        let updated: Query<T>[] = [];

        for (let i = 0; i < queries.length; ++i) {
            let reduced = query.reduce(queries[i]);

            if (reduced) {
                updated.push(reduced);
            }
        }

        updated.push(query);
        this._queries.set(query.entityType, updated.sort((a, b) => a.identity.priority - b.identity.priority));
    }

    private _buildQueriesFromPayload(args: {
        metadata: AnyClassMetadata;
        payload: IEntity[];
        expand?: ArrayLike<Expansion>;
        skipRoot?: boolean;
        isDto?: boolean;
    }): void {
        if (args.payload.length == 0) return;

        let metadata = args.metadata;
        let payload = args.payload;
        let expand = args.expand || [];
        let skipRoot = args.skipRoot || false;
        let isDto = args.isDto || false;

        if (!skipRoot) {
            let q = Query.ByIds({
                entity: metadata.entityType,
                expand: expand,
                ids: EntityMapper.collectLocal(payload, metadata.primaryKey, isDto)
            });

            this._merge(q);
        }

        for (let i = 0; i < expand.length; ++i) {
            let expansion = expand[i];

            this._buildQueriesFromPayload({
                metadata: expansion.property.otherTypeMetadata,
                payload: EntityMapper.collectNavigation(payload, expansion.property, isDto),
                expand: expansion.expansions,
                isDto: isDto
            });
        }
    }
}
