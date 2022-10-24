import { EntitySchemaCatalog } from "@entity-space/common";
import { parseQuery } from "../../lib/query/parse-query.fn";
import { reduceQuery } from "../../lib/query/reduce-query.fn";

export function expectQuery(
    query: string,
    schemas: EntitySchemaCatalog,
    specFn = it
): {
    minus(other: string): {
        toBe(expected: boolean | string | string[]): void;
    };
} {
    return {
        minus(other) {
            return {
                toBe(expected) {
                    if (expected === true) {
                        specFn(`${query} should be fully subtracted by ${other}`, () => {
                            const result = reduceQuery(parseQuery(query, schemas), parseQuery(other, schemas));
                            expect(result).toEqual([]);
                        });
                    } else if (expected === false) {
                        specFn(`${query} should not be subtracted by ${other}`, () => {
                            expect(
                                reduceQuery(parseQuery(query, schemas), parseQuery(other, schemas)).toString()
                            ).toEqual("false");
                        });
                    } else {
                        specFn(`${query} minus ${other} should be ${expected}`, () => {
                            const result = reduceQuery(parseQuery(query, schemas), parseQuery(other, schemas));

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
    };
}
