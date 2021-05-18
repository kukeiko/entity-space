import { createInValueCriterion, renderInValueCriterion } from "../../../src";

describe("renderInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = createInValueCriterion([1, 2, 3]);
        const expected = "{1, 2, 3}";

        // act
        const actual = renderInValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
