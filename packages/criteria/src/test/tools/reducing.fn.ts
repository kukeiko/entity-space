import { Criterion } from "../../lib/criterion/criterion";
import { parseCriteria } from "../../lib/parser/parse-criteria.fn";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function freducing(criterion: Criterion | string) {
    return reducing(criterion, fit);
}

export function xreducing(criterion: Criterion | string) {
    return reducing(criterion, xit);
}

export function reducing(
    criterion: Criterion | string,
    specFn = it
): {
    by(other: Criterion | string): { shouldBe(expected: Criterion | string | boolean): void };
} {
    return {
        by(other: Criterion | string) {
            return {
                shouldBe(expected: Criterion | string | boolean) {
                    if (expected === true) {
                        specFn(`${criterion} should be fully reduced by ${other}`, () => {
                            expect(parse(other).reduce(parse(criterion)).toString()).toEqual("true");
                        });
                    } else if (expected === false) {
                        specFn(`${criterion} should not be reduced by ${other}`, () => {
                            expect(parse(other).reduce(parse(criterion)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criterion} reduced by ${other} should be ${expected}`, () => {
                            expect(parse(other).reduce(parse(criterion)).toString()).toEqual(
                                parse(expected).toString()
                            );
                        });
                    }
                },
            };
        },
    };
}