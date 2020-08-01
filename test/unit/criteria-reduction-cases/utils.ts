import { ValueCriteria, ValueCriterion, Criterion, reduceCriterion, reduceValueCriteria, reduceValueCriterion } from "src";

export function expectValueCriteriaReduction(description: string, a: ValueCriteria, b: ValueCriteria, expected: ReturnType<typeof reduceValueCriteria> | "no-change"): void {
    try {
        const expectation = expect(reduceValueCriteria(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(a);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}

export function expectValueCriterionReduction(description: string, a: ValueCriterion, b: ValueCriterion, expected: ReturnType<typeof reduceValueCriterion> | "no-change"): void {
    try {
        const expectation = expect(reduceValueCriterion(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(a);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}

export function expectCriterionReduction(description: string, a: Criterion, b: Criterion, expected: ReturnType<typeof reduceCriterion> | "no-change"): void {
    try {
        const expectation = expect(reduceCriterion(a, b)).withContext(description);

        if (expected === "no-change") {
            expectation.toBe(a);
        } else {
            expectation.toEqual(expected);
        }
    } catch (error) {
        fail(`${description}: ${error?.message || error}`);
    }
}
