import { Filter } from "../elements";

export module OData {
    export function formatFilter(filter: Filter): string {
        let shards: string[] = [];

        for (let k in filter.criteria) {
            let c = filter.criteria[k];

            if (Filter.isRangeCriterion(c)) {
                shards.push(`(${k} ge ${formatFilterValue(c.type, c.range[0])} and ${k} le ${formatFilterValue(c.type, c.range[1])})`)
            } else if (Filter.isSetCriterion(c)) {
                if (c.values.size == 0) continue;

                if (c.values.size == 1) {
                    shards.push(`${k} eq ${formatFilterValue(c.type, c.values.values().next().value)}`);
                } else {
                    shards.push(`(${k} eq ` +
                        Array.from(c.values.values() as IterableIterator<any>)
                            .map(v => formatFilterValue(c.type, v))
                            .join(` or ${k} eq `) + ")");
                }
            } else {
                shards.push(`${k} ${formatFilterOp(c.op)} ${formatFilterValue(c.type, c.value)}`)
            }
        }

        return shards.join(" and ");
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
