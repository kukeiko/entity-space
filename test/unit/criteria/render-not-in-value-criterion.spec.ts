import { NotInSetCriterion } from "../../../src";

describe("renderNotInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = new NotInSetCriterion(Number, [1, 2, 3]);
        const expected = "!{1, 2, 3}";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});
