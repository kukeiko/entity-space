import { Criterion } from "../criterion";
import { parseCriteria } from "../parser";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function fintersecting(criterion: Criterion | string) {
    return intersecting(criterion, fit);
}

export function xintersecting(criterion: Criterion | string) {
    return intersecting(criterion, xit);
}

export function intersecting(
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
                        specFn(`${criterion} should not intersect with ${other}`, () => {
                            try {
                                expect(parse(criterion).intersect(parse(other)).toString()).toEqual("false");
                            } catch (error) {
                                fail(error);
                            }
                        });
                    } else {
                        specFn(`${criterion} intersected with ${other} should be ${expected}`, () => {
                            try {
                                expect(parse(criterion).intersect(parse(other)).toString()).toEqual(
                                    parse(expected).toString()
                                );
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
