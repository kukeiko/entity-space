import { Criterion } from "../../lib/criteria/criterion/criterion";
import { parseCriteria } from "../../lib/criteria/parser/parse-criteria.fn";

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
                    expect(parse(criterion).invert()).toEqual(false);
                });
            } else {
                specFn(`${criterion} inverted should be ${expected}`, () => {
                    expect(parse(criterion).invert().toString()).toEqual(parse(expected).toString());
                });
            }
        },
    };
}
