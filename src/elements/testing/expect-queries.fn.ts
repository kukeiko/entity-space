import { expect, test, TestAPI } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { mergeQueries } from "../query/merge-queries.fn";
import { parseQuery } from "../query/parse-query.fn";

export function expectQueries(
    catalog: EntitySchemaCatalog,
    queries: string[],
    specFn: TestAPI | TestAPI["skip"] = test,
): {
    plus(): { toEqual(expected: string[] | false): void };
} {
    const parse = (input: string[]) => input.map(input => parseQuery(input, catalog));

    return {
        plus() {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${queries.join(" + ")} = (incompatible)`, () => {
                            expect(mergeQueries(parse(queries)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${queries.join(" + ")} = ${expected}`, () => {
                            expect(mergeQueries(parse(queries)).toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
    };
}
