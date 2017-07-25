import { ITypeOf } from "../util";
import { IEntityClass } from "../metadata";
import { IQueryExecuter } from "./query-executer";

let byEntityTypeMap = new Map<IEntityClass<any>, ITypeOf<IQueryExecuter<any>>>();

export function QueryExecuter(entityTypes?: IEntityClass<any>[]) {
    return (type: ITypeOf<IQueryExecuter<any>>) => {
        entityTypes.forEach(entityType => byEntityTypeMap.set(entityType, type));
    };
}

export function getQueryExecuterType(entityType: IEntityClass<any>): ITypeOf<IQueryExecuter<any>> {
    let type = byEntityTypeMap.get(entityType);
    if (!type) return null;

    return type || null;
}

export function getAllQueryExecuters(): Map<IEntityClass<any>, ITypeOf<IQueryExecuter<any>>> {
    return byEntityTypeMap;
}
