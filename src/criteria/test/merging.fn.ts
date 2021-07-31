import { Criterion } from "../criterion";
import { parseCriteria } from "../parser";

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
                        specFn(`${criterion} should not be reduced by ${other}`, () => {
                            try {
                                expect(parse(criterion).merge(parse(other)).toString()).toEqual("false");
                            } catch (error) {
                                fail(error);
                            }
                        });
                    } else {
                        specFn(`${criterion} reduced by ${other} should be ${expected}`, () => {
                            try {
                                expect(parse(criterion).merge(parse(other)).toString()).toEqual(parse(expected).toString());
                            } catch (error) {
                                fail(error);
                            }
                        });
                    }
                },
            };
        },
    };
}
