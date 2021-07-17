import { inRange, inSet, or } from "../../../src";

describe("renderor()", () => {
    it("should render brackets even if there is only 1 element", () => {
        // arrange
        const criteria = or([inSet([1, 2, 3])]);
        const expected = "({1, 2, 3})";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = or([inSet([1, 2, 3]), inRange(0, 7)]);
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });
});
