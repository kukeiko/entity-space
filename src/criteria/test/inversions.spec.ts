import { inRange, inSet, isEven, notInSet, or } from "../value-criterion";

describe("invert: binary", () => {
    it("is-even inverted should be is-odd", () => {
        // arrange
        const criterion = isEven(true);
        const expected = isEven(false);

        // act
        const inverted = criterion.invert();

        // assert
        expect(inverted).toEqual(expected);
    });
});

describe("invert: in-set", () => {
    it("{1, 2, 3} inverted should be !{1, 2, 3}", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const expected = notInSet([1, 2, 3]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});

describe("invert: not-in-set", () => {
    it("!{1, 2, 3} inverted should be {1, 2, 3}", () => {
        // arrange
        const criterion = notInSet([1, 2, 3]);
        const expected = inSet([1, 2, 3]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});

describe("invert: in-range", () => {
    it("[1, 7] inverted should be [..., 1) | (7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7);
        const expected = or([inRange(void 0, 1, false), inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] inverted should be [..., 1] | (7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7, [false, true]);
        const expected = or([inRange(void 0, 1), inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) inverted should be [..., 1] | [7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7, false);
        const expected = or([inRange(void 0, 1), inRange(7, void 0)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7] inverted should be (7, ...]", () => {
        // arrange
        const criterion = inRange(void 0, 7);
        const expected = or([inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[7, ...] inverted should be [..., 7)", () => {
        // arrange
        const criterion = inRange(7, void 0);
        const expected = or([inRange(void 0, 7, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
