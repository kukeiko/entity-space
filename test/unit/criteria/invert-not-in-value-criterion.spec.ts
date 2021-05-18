import { createInValueCriterion, createNotInValueCriterion, invertNotInValueCriterion } from "../../../src";

describe("invertNotInValueCriterion()", () => {
    it("!{1, 2, 3} inverted should be {1, 2, 3}", () => {
        // arrange
        const criterion = createNotInValueCriterion([1, 2, 3]);
        const expected = [createInValueCriterion([1, 2, 3])];

        // act
        const actual = invertNotInValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
