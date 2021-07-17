import { parseCriteria, ValueCriterion } from "../../value-criterion";

function parseIfNecessary<T extends ValueCriterion | string>(item: T): ValueCriterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function reducing(
    criterion: ValueCriterion | string
): {
    by(other: ValueCriterion | string): { is(expected: ValueCriterion | string | boolean): void };
} {
    const parsedCriterion = parseIfNecessary(criterion);

    return {
        by(other: ValueCriterion | string) {
            const parsedOther = parseIfNecessary(other);

            return {
                is(expected: ValueCriterion | string | boolean) {
                    if (expected === true) {
                        it(`${criterion} should be fully reduced by ${other}`, () => expect(parsedOther.reduce(parsedCriterion).toString()).toEqual("true"));
                    } else if (expected === false) {
                        it(`${criterion} should not be reduced by ${other}`, () => expect(parsedOther.reduce(parsedCriterion).toString()).toEqual("false"));
                    } else {
                        const parsedExpected = parseIfNecessary(expected);
                        it(`${criterion} reduced by ${other} should be ${expected}`, () =>
                            expect(parsedOther.reduce(parsedCriterion).toString()).toEqual(parsedExpected.toString()));
                    }
                },
            };
        },
    };
}
