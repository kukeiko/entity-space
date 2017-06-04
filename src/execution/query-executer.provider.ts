import { ITypeOf } from "../util";
import { IEntityClass } from "../metadata";
import { IQueryExecuter } from "./query-executer";
import { getQueryExecuterType } from "./query-executer.decorator";

export type ResolveQueryExecuter = (type: ITypeOf<IQueryExecuter<any>>) => IQueryExecuter<any>;

export class QueryExecuterProvider {
    private _queryExecuters = new Map<IEntityClass<any>, IQueryExecuter<any>>();
    private _resolve: ResolveQueryExecuter = null;

    constructor(resolve: ResolveQueryExecuter) {
        this._resolve = resolve;
    }

    async get<T>(entityType: IEntityClass<T>): Promise<IQueryExecuter<T>> {
        let queryExecuter = this._queryExecuters.get(entityType);

        if (!queryExecuter) {
            let queryExecuterType = getQueryExecuterType(entityType);

            if (!queryExecuterType) {
                throw `no query executer for entity type ${entityType.name} found`;
            }

            let queryExecuter = this._resolve(queryExecuterType);

            this._queryExecuters.set(entityType, queryExecuter);
        }

        return this._queryExecuters.get(entityType) as IQueryExecuter<T>;
    }
}
