import { inRange, inSet, notInSet, or } from "../value-criterion";

describe("render: in-set", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const expected = "{1, 2, 3}";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});

describe("render: not-in-set", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = notInSet([1, 2, 3]);
        const expected = "!{1, 2, 3}";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});

describe("render: value-criteria", () => {
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

describe("render: in-range", () => {
    it("[1, 7] should be rendered correctly", () => {
        // arrange
        const criterion = inRange(1, 7);
        const expected = "[1, 7]";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] should be rendered correctly", () => {
        // arrange
        const criterion = inRange(1, 7, [false, true]);
        const expected = "(1, 7]";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[1, 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange(1, 7, [true, false]);
        const expected = "[1, 7)";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange(1, 7, false);
        const expected = "(1, 7)";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange(void 0, 7, false);
        const expected = "[..., 7)";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(7, ...] should be rendered correctly", () => {
        // arrange
        const criterion = inRange(7, void 0, false);
        const expected = "(7, ...]";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});
