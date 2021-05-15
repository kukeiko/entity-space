import { createInValueCriterion, createNotInValueCriterion, invertInValueCriterion } from "../../../src";

describe("invertInValueCriterion", () => {
    it("invert in(1, 2, 3) should be not-in(1, 2, 3)", () => {
        // arrange
        const criterion = createInValueCriterion([1, 2, 3]);
        const expected = [createNotInValueCriterion([1, 2, 3])];

        // act
        const actual = invertInValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
