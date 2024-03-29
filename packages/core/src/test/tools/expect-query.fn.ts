import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

export function expectQuery(
    query: string,
    schemas: EntitySchemaCatalog,
    specFn = it
): {
    minus(other: string): {
        toBe(expected: boolean | string | string[]): void;
    };
    plus(other: string): {
        toBe(expected: false | string): void;
    };
} {
    const criteriaTools = new EntityCriteriaTools();
    const queryTools = new EntityQueryTools({ criteriaTools: criteriaTools });
    const { subtractQuery, mergeQuery, parseQuery } = queryTools.toDestructurable();

    return {
        minus(other) {
            return {
                toBe(expected) {
                    if (expected === true) {
                        specFn(`${query} should be fully subtracted by ${other}`, () => {
                            const result = subtractQuery(
                                queryTools,
                                parseQuery(query, schemas),
                                parseQuery(other, schemas)
                            );
                            expect(result).toEqual([]);
                        });
                    } else if (expected === false) {
                        specFn(`${query} should not be subtracted by ${other}`, () => {
                            expect(
                                subtractQuery(
                                    queryTools,
                                    parseQuery(query, schemas),
                                    parseQuery(other, schemas)
                                ).toString()
                            ).toEqual("false");
                        });
                    } else {
                        specFn(`${query} minus ${other} should be ${expected}`, () => {
                            const result = subtractQuery(
                                queryTools,
                                parseQuery(query, schemas),
                                parseQuery(other, schemas)
                            );

                            if (Array.isArray(expected)) {
                                expected = expected.map(query => parseQuery(query, schemas)).join(",") as string;
                            } else if (typeof expected === "string") {
                                expected = parseQuery(expected, schemas).toString();
                            } else {
                                throw new Error(
                                    "kinda weird that 'expected' can be a boolean here, just because we reassign it"
                                );
                            }

                            expect(result.toString()).toEqual(expected);
                        });
                    }
                },
            };
        },
        plus(other) {
            return {
                toBe(expected) {
                    if (expected === false) {
                        specFn(`${query} should not be addable with ${other}`, () => {
                            expect(
                                mergeQuery(parseQuery(query, schemas), parseQuery(other, schemas)).toString()
                            ).toEqual("false");
                        });
                    } else {
                        specFn(`${query} plus ${other} should be ${expected}`, () => {
                            expect(
                                mergeQuery(parseQuery(query, schemas), parseQuery(other, schemas)).toString()
                            ).toEqual(parseQuery(expected, schemas).toString());
                        });
                    }
                },
            };
        },
    };
}
