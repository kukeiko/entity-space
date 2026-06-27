import { isDefined } from "@entity-space/utils";

export type ODataExpansion = { [K in string]: true | ODataExpansion };
export type ODataPrimitiveValue = number | string | boolean | null | Date;

export type ODataPrimitiveCriterion = {
    property: string;
    operation: "eq" | "ne" | "lt" | "le" | "gt" | "ge" | "in";
    value: ODataPrimitiveValue | ODataPrimitiveValue[];
    isGuid?: boolean;
};

export type ODataArrayCriterion = {
    property: string;
    operation: "any" | "all";
    criterion: ODataPrimitiveCriterion | ODataLogicalCriterion;
};

export interface ODataLogicalCriterion {
    combinator: "and" | "or";
    criteria: ODataCriterion[];
}

export type ODataCriterion = ODataPrimitiveCriterion | ODataArrayCriterion | ODataLogicalCriterion;

export interface ODataUrlParams {
    $expand?: string;
    $filter?: string;
}

export namespace OData {
    export function toUrlPath(name: string, id?: string | number, v4 = false, isGuid = false): string {
        if (id === undefined || !id.toString().length) {
            return name;
        } else if (typeof id === "string" && !v4 && isGuid) {
            return `${name}(guid'${id}')`;
        }

        return `${name}(${id})`;
    }

    export function toQueryParameters(
        expansion?: ODataExpansion,
        filter?: ODataLogicalCriterion,
        v4 = false,
    ): ODataUrlParams {
        const params: ODataUrlParams = {};

        if (expansion) {
            params.$expand = toExpandQueryParameter(expansion, v4);
        }

        if (filter) {
            params.$filter = toFilterQueryParameter(filter, v4);
        }

        return params;
    }

    export function toExpandQueryParameter(expansion: ODataExpansion, v4 = false): string | undefined {
        function toV2Expand(expansion: ODataExpansion): string[] {
            return Object.entries(expansion).flatMap(([key, value]) =>
                value === true ? key : toV2Expand(value).map(subExpansion => `${key}/${subExpansion}`),
            );
        }

        function toV4Expand(expansion: ODataExpansion): string {
            return Object.entries(expansion)
                .map(([key, value]) => (value === true ? key : `${key}($expand=${toV4Expand(value)})`))
                .join(",");
        }

        if (v4) {
            return toV4Expand(expansion) || undefined;
        } else {
            return toV2Expand(expansion).join(",") || undefined;
        }
    }

    export function toFilterQueryParameter(criterion: ODataCriterion, v4 = false): string | undefined {
        const result = criterionToString(criterion, v4);

        return result?.length ? result : undefined;
    }

    function criterionToString(criterion: ODataCriterion, v4 = false, path: string[] = []): string | undefined {
        const prefix = path.length > 0 ? `${path.join("/")}/` : "";

        if ("combinator" in criterion) {
            const filterString = criterion.criteria
                .map(criterion => criterionToString(criterion, v4, path))
                .filter(isDefined)
                .join(` ${criterion.combinator} `);

            if (!filterString.length) {
                return undefined;
            }

            return criterion.criteria.length > 1 ? `(${filterString})` : filterString;
        } else if ("value" in criterion) {
            if (criterion.operation === "in" && !v4) {
                return criterionToString(downLevelInCriterion(criterion), v4, path);
            }

            return `${prefix}${criterion.property} ${criterion.operation} ${criterionValueToString(criterion.value, criterion.isGuid, v4)}`;
        } else {
            const lambdaCriterion = criterionToString(criterion.criterion, v4, [...path, "x"]);

            if (lambdaCriterion === undefined) {
                return undefined;
            }

            // [todo] use a-z for lambdas, by passing around already used lambdas and taking next free one
            return `${prefix}${criterion.property}/${criterion.operation}(x: ${lambdaCriterion})`;
        }
    }

    function criterionValueToString(value: ODataPrimitiveCriterion["value"], isGuid = false, v4 = false): string {
        if (Array.isArray(value)) {
            return `(${value.map(v => primitiveToString(v, isGuid, v4)).join(", ")})`;
        } else {
            return primitiveToString(value, isGuid, v4);
        }
    }

    function primitiveToString(value: ODataPrimitiveCriterion["value"], isGuid = false, v4 = false): string {
        // [todo] ❌ check string format to determine if is guid/date
        if (value == null) {
            return "null";
        } else if (isGuid) {
            return v4 ? value.toString() : `guid'${value}'`;
        } else if (value instanceof Date) {
            return v4 ? (value as Date).toISOString() : `datetimeoffset'${(value as Date).toISOString()}'`;
        } else if (typeof value == "string") {
            return `'${value}'`;
        } else if (typeof value === "boolean") {
            return value ? "true" : "false";
        } else if (typeof value === "number") {
            return value.toString();
        } else {
            throw new Error(`Unsupported OData criterion value type: ${typeof value}`);
        }
    }

    function downLevelInCriterion(criterion: ODataPrimitiveCriterion): ODataLogicalCriterion {
        const value = Array.isArray(criterion.value) ? criterion.value : [criterion.value];

        return {
            combinator: "or",
            criteria: value.map(v => ({
                property: criterion.property,
                operation: "eq",
                value,
                isGuid: criterion.isGuid,
            })),
        };
    }
}
