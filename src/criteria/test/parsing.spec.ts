import { inRange, or, parseCriteria } from "../value-criterion";

describe("parse: in-range", () => {
    it("should parse [1, 7]", () => {
        // arrange
        const rendered = "[1, 7]";
        const expected = inRange(1, 7);
        const parse = () => parseCriteria(rendered);
        expect(parse).not.toThrow();
        expect(parse()).toEqual(expected);
    });

    it("should parse [..., 7.8)", () => {
        // arrange
        const rendered = "[..., 7.8)";
        const expected = inRange(void 0, 7.8, false);
        const parse = () => parseCriteria(rendered);
        expect(parse).not.toThrow();
        expect(parse()).toEqual(expected);
    });

    it("should parse [.9, ...]", () => {
        // arrange
        const rendered = "[.9, ...]";
        const expected = inRange(0.9);
        const parse = () => parseCriteria(rendered);
        expect(parse).not.toThrow();
        expect(parse()).toEqual(expected);
    });

    it("should parse [-.9, +1.2]", () => {
        // arrange
        const rendered = "[-.9, +1.2]";
        const expected = inRange(-0.9, 1.2);
        const parse = () => parseCriteria(rendered);
        expect(parse).not.toThrow();
        expect(parse()).toEqual(expected);
    });

    it("should parse [..., 3) | (4, 7]", () => {
        const parse = () => parseCriteria("[..., 3) | (4, 7]");
        expect(parse).not.toThrow();
        expect(parse()).toEqual(or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));
    });
});
