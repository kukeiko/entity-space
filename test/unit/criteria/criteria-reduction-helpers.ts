import { ValueCriterion } from "../../../src";

// using .toString() so we see the string representations of the failed reductions

export function isFullyReduced(what: ValueCriterion, by: ValueCriterion) {
    it(`${what} should be fully reduced by ${by}`, () => expect(by.reduce(what).toString()).toEqual("true"));
}

export function isNotReduced(what: ValueCriterion, by: ValueCriterion) {
    it(`${what} should not be reduced by ${by}`, () => expect(by.reduce(what).toString()).toEqual("false"));
}

export function isPartiallyReduced(what: ValueCriterion, by: ValueCriterion, expected: ValueCriterion) {
    it(`${what} reduced by ${by} should be ${expected}`, () => expect(by.reduce(what).toString()).toEqual(expected.toString()));
}
