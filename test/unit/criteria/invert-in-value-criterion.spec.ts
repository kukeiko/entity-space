import { InSetCriterion, NotInSetCriterion } from "../../../src";

describe("invertInValueCriterion", () => {
    it("{1, 2, 3} inverted should be !{1, 2, 3}", () => {
        // arrange
        const criterion = new InSetCriterion(Number, [1, 2, 3]);
        const expected = [new NotInSetCriterion(Number, [1, 2, 3])];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
