import { Criterion } from "../../lib/criteria/criterion/criterion";
import { parseCriteria } from "../../lib/criteria/parser/parse-criteria.fn";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function fmerging(criterion: Criterion | string) {
    return merging(criterion, fit);
}

export function xmerging(criterion: Criterion | string) {
    return merging(criterion, xit);
}

export function merging(
    criterion: Criterion | string,
    specFn = it
): {
    with(other: Criterion | string): { shouldBe(expected: Criterion | string | false): void };
} {
    return {
        with(other: Criterion | string) {
            return {
                shouldBe(expected: Criterion | string | false) {
                    if (expected === false) {
                        specFn(`${criterion} should not merge with ${other}`, () => {
                            expect(parse(criterion).merge(parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criterion} merged with ${other} should be ${expected}`, () => {
                            expect(parse(criterion).merge(parse(other)).toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
    };
}
