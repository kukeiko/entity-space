import { createNotInValueCriterion, renderNotInValueCriterion } from "../../../src";

describe("renderNotInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = createNotInValueCriterion([1, 2, 3]);
        const expected = "!{1, 2, 3}";

        // act
        const actual = renderNotInValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
