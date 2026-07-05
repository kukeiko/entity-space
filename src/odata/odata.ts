import { isDefined } from "@entity-space/utils";

export type ODataExpansion = { [K in string]: true | ODataExpansion };
export type ODataPrimitiveValue = number | string | boolean | null | Date;

export type ODataPrimitiveCriterion = {
    property: string;
    operation: "eq" | "ne" | "lt" | "le" | "gt" | "ge" | "in" | "not-in";
    value: ODataPrimitiveValue | ODataPrimitiveValue[];
};

export type ODataArrayCriterion = {
    property: string;
    operation: "any" | "all";
    criterion: ODataCriterion;
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

function looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function looksLikeDate(value: string) {
    return Number.isFinite(Date.parse(value));
}

export namespace OData {
    export function toUrlPath(name: string, id?: string | number, v4 = false): string {
        if (id === undefined || !id.toString().length) {
            return name;
        }

        return `${name}(${primitiveToString(id, v4)})`;
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

    function criterionToString(
        criterion: ODataCriterion,
        v4 = false,
        path: string[] = [],
        lambdaIndex = 0,
    ): string | undefined {
        const prefix = path.length > 0 ? `${path.join("/")}/` : "";

        if ("combinator" in criterion) {
            const filterString = criterion.criteria
                .map(criterion => criterionToString(criterion, v4, path, lambdaIndex))
                .filter(isDefined)
                .join(` ${criterion.combinator} `);

            if (!filterString.length) {
                return undefined;
            }

            return criterion.criteria.length > 1 ? `(${filterString})` : filterString;
        } else if ("value" in criterion) {
            if (!v4 && criterion.operation === "in") {
                return criterionToString(downLevelInCriterion(criterion), v4, path, lambdaIndex);
            } else if (criterion.operation == "not-in") {
                if (!v4) {
                    return criterionToString(downLevelInCriterion(criterion), v4, path, lambdaIndex);
                } else {
                    return `${prefix}${criterion.property} in ${criterionValueToString(criterion.value, v4)} eq false`;
                }
            }

            return `${prefix}${criterion.property} ${criterion.operation} ${criterionValueToString(criterion.value, v4)}`;
        } else {
            const lambda = String.fromCharCode(lambdaIndex + "a".charCodeAt(0));
            lambdaIndex++;
            lambdaIndex = lambdaIndex % 26;

            const lambdaCriterion = criterionToString(criterion.criterion, v4, [...path, "x"], lambdaIndex);

            if (lambdaCriterion === undefined) {
                return undefined;
            }

            return `${prefix}${criterion.property}/${criterion.operation}(${lambda}: ${lambdaCriterion})`;
        }
    }

    function criterionValueToString(value: ODataPrimitiveCriterion["value"], v4 = false): string {
        if (Array.isArray(value)) {
            return `(${value.map(v => primitiveToString(v, v4)).join(", ")})`;
        } else {
            return primitiveToString(value, v4);
        }
    }

    function primitiveToString(value: ODataPrimitiveCriterion["value"], v4 = false): string {
        if (value == null) {
            return "null";
        } else if (typeof value == "string") {
            if (looksLikeDate(value)) {
                return v4 ? new Date(value).toISOString() : `datetimeoffset'${new Date(value).toISOString()}'`;
            } else if (looksLikeUuid(value)) {
                return v4 ? value.toString() : `guid'${value}'`;
            } else {
                return `'${value}'`;
            }
        } else if (typeof value === "number") {
            return value.toString();
        } else if (typeof value === "boolean") {
            return value ? "true" : "false";
        } else if (value instanceof Date) {
            return v4 ? value.toISOString() : `datetimeoffset'${value.toISOString()}'`;
        } else {
            throw new Error(`unsupported OData value type: ${typeof value}`);
        }
    }

    function downLevelInCriterion(criterion: ODataPrimitiveCriterion): ODataLogicalCriterion {
        const value = Array.isArray(criterion.value) ? criterion.value : [criterion.value];

        if (criterion.operation === "in") {
            return {
                combinator: "or",
                criteria: value.map(v => ({
                    property: criterion.property,
                    operation: "eq",
                    value,
                })),
            };
        } else if (criterion.operation === "not-in") {
            return {
                combinator: "and",
                criteria: value.map(v => ({
                    property: criterion.property,
                    operation: "ne",
                    value,
                })),
            };
        } else {
            throw new Error(`can't downlevel OData criterion "${criterion.operation}"`);
        }
    }
}
