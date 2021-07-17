import { ValueCriterion } from "../../../src";

export function reducing(
    criterion: ValueCriterion
): {
    by(other: ValueCriterion): { is(expected: ValueCriterion | boolean): void };
} {
    return {
        by(other: ValueCriterion) {
            return {
                is(expected: ValueCriterion | boolean) {
                    if (expected === true) {
                        it(`${criterion} should be fully reduced by ${other}`, () => expect(other.reduce(criterion).toString()).toEqual("true"));
                    } else if (expected === false) {
                        it(`${criterion} should not be reduced by ${other}`, () => expect(other.reduce(criterion).toString()).toEqual("false"));
                    } else {
                        it(`${criterion} reduced by ${other} should be ${expected}`, () => expect(other.reduce(criterion).toString()).toEqual(expected.toString()));
                    }
                },
            };
        },
    };
}
