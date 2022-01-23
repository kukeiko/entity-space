import { and, AndCriteria, inRange, or, OrCriteria } from "../criterion";

describe("collapsing-behaviour", () => {
    it("or() should return OrCriteria, even if only given 1 element", () => {
        const actual = or(inRange(1, 7));
        const expected = new OrCriteria([inRange(1, 7)]);

        expect(actual).toEqual(expected);
    });

    it("and() should return AndCriteria, even if only given 1 element", () => {
        const actual = and(inRange(1, 7));
        const expected = new AndCriteria([inRange(1, 7)]);

        expect(actual).toEqual(expected);
    });
});
