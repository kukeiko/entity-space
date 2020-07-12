import { ValueCriteria, ValueCriterion, ObjectCriterion } from "../../../src";

export function expectValueCriteriaReduction(description: string, a: ValueCriteria, b: ValueCriteria, expected: ReturnType<typeof ValueCriteria.reduce> | "no-change"): void {
    try {
        let expectation = expect(ValueCriteria.reduce(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(b);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}

export function expectValueCriterionReduction(description: string, a: ValueCriterion, b: ValueCriterion, expected: ReturnType<typeof ValueCriterion.reduce> | "no-change"): void {
    try {
        let expectation = expect(ValueCriterion.reduce(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(b);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}

export function expectObjectCriterionReduction(description: string, a: ObjectCriterion, b: ObjectCriterion, expected: ReturnType<typeof ObjectCriterion.reduce> | "no-change"): void {
    try {
        let expectation = expect(ObjectCriterion.reduce(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(b);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}
