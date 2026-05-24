import { expect, test, TestAPI } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { mergeQuery } from "../query/merge-query.fn";
import { parseQuery } from "../query/parse-query.fn";
import { subtractQuery } from "../query/subtract-query.fn";

export function expectQuery(
    catalog: EntitySchemaCatalog,
    query: string,
    specFn: TestAPI | TestAPI["skip"] = test,
): {
    plus(other: string): { toEqual(expected: string | false): void };
    minus(other: string): { toEqual(expected: string | string[] | boolean): void };
} {
    const parse = (input: string) => parseQuery(input, catalog);

    return {
        plus(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${query} + ${other} = (incompatible)`, () => {
                            expect(mergeQuery(parse(query), parse(other)).toString()).toEqual("false");
                            // [todo] ❌ doesn't work yet - make it work
                            // expect(mergeQuery(parse(other), parse(query)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${query} + ${other} = ${expected}`, () => {
                            expect(mergeQuery(parse(query), parse(other)).toString()).toEqual(
                                parse(expected).toString(),
                            );
                            // [todo] ❌ doesn't work yet - make it work
                            // expect(mergeQuery(parse(other), parse(query)).toString()).toEqual(
                            //     parse(expected).toString(),
                            // );
                        });
                    }
                },
            };
        },
        minus(other) {
            return {
                toEqual(expected) {
                    if (expected === true) {
                        specFn(`${query} - ${other} = (empty)`, () => {
                            expect(subtractQuery(parse(query), parse(other)).toString()).toEqual("true");
                        });
                    } else if (expected === false) {
                        specFn(`${query} - ${other} = (incompatible)`, () => {
                            expect(subtractQuery(parse(query), parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${query} - ${other} = ${expected.toString()}`, () => {
                            expect(subtractQuery(parse(query), parse(other)).toString()).toEqual(expected.toString());
                        });
                    }
                },
            };
        },
    };
}
