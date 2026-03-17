import { expect, test, TestAPI } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { mergeQuery } from "../query/merge-query.fn";
import { parseQuery } from "../query/parse-query.fn";

export function expectQuery(
    catalog: EntitySchemaCatalog,
    query: string,
    specFn: TestAPI | TestAPI["skip"] = test,
): {
    plus(other: string): { toEqual(expected: string | false): void };
} {
    const parse = (input: string) => parseQuery(input, catalog);

    return {
        plus(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${query} + ${other} = (incompatible)`, () => {
                            expect(mergeQuery(parse(query), parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${query} + ${other} = ${expected}`, () => {
                            expect(mergeQuery(parse(query), parse(other)).toString()).toEqual(
                                parse(expected).toString(),
                            );
                        });
                    }
                },
            };
        },
    };
}
