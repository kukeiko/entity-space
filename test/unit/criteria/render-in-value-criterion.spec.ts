import { InSetCriterion } from "../../../src/criteria/value-criterion/_new-stuff/in-set-criterion";

describe("renderInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = new InSetCriterion(Number, [1, 2, 3]);
        const expected = "{1, 2, 3}";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});
