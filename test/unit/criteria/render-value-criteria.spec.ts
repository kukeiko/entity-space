import { inRange, inSet, valueCriteria } from "../../../src";

describe("renderValueCriteria()", () => {
    it("should render brackets even if there is only 1 element", () => {
        // arrange
        const criteria = valueCriteria([inSet([1, 2, 3])]);
        const expected = "({1, 2, 3})";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = valueCriteria([inSet([1, 2, 3]), inRange(0, 7)]);
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });
});
