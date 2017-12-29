import { getEntityMetadata, AnyEntityMetadata } from "../metadata";
import { Query, Expansion, Filter, ByIndexes } from "../elements";

export module OData {
    export interface UrlParams {
        $expand?: string;
        $filter?: string;
    }

    export function buildUrlParams(q: Query<any>): OData.UrlParams {
        let params: OData.UrlParams = {};
        let metadata = getEntityMetadata(q.entityType);

        if (q.expansions.length > 0) {
            params.$expand = OData.buildExpansions(q.expansions);
        }

        let filterShards: string[] = [];

        if (q.identity.type == "indexes") {
            let builtCriteria = OData.buildCriteria(metadata, q.identity.criteria);
            builtCriteria && filterShards.push(builtCriteria);
        }

        if (q.filter) {
            let builtFilter = OData.buildFilter(metadata, q.filter);
            builtFilter && filterShards.push(builtFilter);
        }

        if (filterShards.length > 0) {
            params.$filter = filterShards.join(" and ");
        }

        return params;
    }

    export function buildExpansions(expand: ArrayLike<Expansion>): string {
        return Array.from(expand).map(exp => exp.toPaths()).reduce((p, c) => p.concat(c), []).map(p => p.toDtoString()).join(",");
    }

    export function buildCriteria(metadata: AnyEntityMetadata, criteria: ByIndexes.Criteria): string | null {
        let shards: string[] = [];

        for (let index in criteria) {
            let v = criteria[index];
            let property = metadata.getPrimitive(index);

            if (property.valueType == "guid") {
                shards.push(`${property.dtoName} eq guid'${v}'`);
            } else if (typeof (v) == "string") {
                shards.push(`${property.dtoName} eq '${v}'`);
            } else {
                shards.push(`${property.dtoName} eq ${v}`);
            }
        }

        return shards.join(" and ") || null;
    }

    export function buildFilter(metadata: AnyEntityMetadata, filter: Filter): string | null {
        let shards: string[] = [];
        filter = filter.toDtoFormat(metadata);

        for (let k in filter.criteria) {
            let c = filter.criteria[k];

            if (Filter.isRangeCriterion(c)) {
                shards.push(`(${k} ge ${formatFilterValue(c.type, c.range[0])} and ${k} le ${formatFilterValue(c.type, c.range[1])})`);
            } else if (Filter.isMemberCriterion(c)) {
                if (c.values.size == 0) continue;

                let operator = c.op == "in" ? "eq" : "ne";
                let logical = c.op == "in" ? "or" : "and";

                if (c.values.size == 1) {
                    shards.push(`${k} ${operator} ${formatFilterValue(c.type, c.values.values().next().value)}`);
                } else {
                    // todo: cast is meh
                    shards.push(`(${k} ${operator} ` +
                        Array.from(c.values.values() as IterableIterator<any>)
                            .map(v => formatFilterValue(c.type, v))
                            .join(` ${logical} ${k} ${operator} `) + ")");
                }
            } else if (Filter.isSetCriterion(c)) {
                // todo: implement via any/all (@ OData spec)
                throw new Error(`OData.formatFilter() doesn't yet support set criteria`);
            } else {
                shards.push(`${k} ${formatFilterOp(c.op)} ${formatFilterValue(c.type, c.value)}`);
            }
        }

        return shards.join(" and ") || null;
    }

    export function formatFilterOp(op: Filter.SingleValueOperations): string {
        switch (op) {
            case "==": return "eq";
            case "!=": return "ne";
            case "<": return "lt";
            case "<=": return "le";
            case ">": return "gt";
            case ">=": return "ge";
            default: throw new Error(`unexpected filter op: ${op} (while trying to format into OData compatible)`);
        }
    }

    export function formatFilterValue(type: Filter.Types, value: any): string {
        if (value == null) return "null";

        switch (type) {
            case "bool": return value ? "true" : "false";
            // todo: which exact date type is used might need to be configurable
            case "date": return `datetimeoffset'${(value as Date).toISOString()}'`;
            case "guid": return `guid'${value}'`;
            case "string": return `'${value}'`;
            case "number":
            default: return value;
        }
    }
}
