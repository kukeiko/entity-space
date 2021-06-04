import { InRangeCriterion, InSetCriterion, ValueCriteria } from "../../../src";

describe("renderValueCriteria()", () => {
    it("should render 1 element without brackets", () => {
        // arrange
        const criteria = new ValueCriteria(Number, [new InSetCriterion(Number, [1, 2, 3])]);
        const expected = "{1, 2, 3}";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = new ValueCriteria(Number, [new InSetCriterion(Number, [1, 2, 3]), new InRangeCriterion(Number, [0, 7])]);
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });
});
