import { inSet, notInSet } from "../../../src";

describe("invertInValueCriterion", () => {
    it("{1, 2, 3} inverted should be !{1, 2, 3}", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const expected = notInSet([1, 2, 3]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
