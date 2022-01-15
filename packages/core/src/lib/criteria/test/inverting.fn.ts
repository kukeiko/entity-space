import { Criterion } from "../criterion";
import { parseCriteria } from "../parser";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function finverting(criterion: Criterion | string) {
    return inverting(criterion, fit);
}

export function xinverting(criterion: Criterion | string) {
    return inverting(criterion, xit);
}

export function inverting(
    criterion: Criterion | string,
    specFn = it
): {
    shouldBe(expected: Criterion | string | false): void;
} {
    return {
        shouldBe(expected: Criterion | string | false) {
            if (expected === false) {
                specFn(`${criterion} should not be invertible`, () => {
                    try {
                        expect(parse(criterion).invert()).toEqual(false);
                    } catch (error) {
                        fail(error);
                    }
                });
            } else {
                specFn(`${criterion} inverted should be ${expected}`, () => {
                    try {
                        expect(parse(criterion).invert().toString()).toEqual(parse(expected).toString());
                    } catch (error) {
                        fail(error);
                    }
                });
            }
        },
    };
}
