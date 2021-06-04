import { InSetCriterion } from "../../../src/criteria/value-criterion/_new-stuff/in-set-criterion";
import { NotInSetCriterion } from "../../../src/criteria/value-criterion/_new-stuff/not-in-set-criterion";

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
