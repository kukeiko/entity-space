import { Criterion } from "../../value-criterion";
import { parseCriteria } from "../../parser";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function reducing(
    criterion: Criterion | string
): {
    by(other: Criterion | string): { is(expected: Criterion | string | boolean): void };
} {
    return {
        by(other: Criterion | string) {
            return {
                is(expected: Criterion | string | boolean) {
                    if (expected === true) {
                        it(`${criterion} should be fully reduced by ${other}`, () => {
                            try {
                                expect(parse(other).reduce(parse(criterion)).toString()).toEqual("true");
                            } catch (error) {
                                fail(error);
                            }
                        });
                    } else if (expected === false) {
                        it(`${criterion} should not be reduced by ${other}`, () => {
                            try {
                                expect(parse(other).reduce(parse(criterion)).toString()).toEqual("false");
                            } catch (error) {
                                fail(error);
                            }
                        });
                    } else {
                        it(`${criterion} reduced by ${other} should be ${expected}`, () => {
                            try {
                                expect(parse(other).reduce(parse(criterion)).toString()).toEqual(parse(expected).toString());
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
