import { isPrimitiveOrNull } from "./is-primitive-or-null-value.fn";

describe("isPrimitiveOrNullValue()", () => {
    it("should be true for numbers using default valueTypes argument", () => {
        expect(isPrimitiveOrNull(1)).toBe(true);
        expect(isPrimitiveOrNull(-1)).toBe(true);
        // [todo] hmm.. do we want this to be true?
        expect(isPrimitiveOrNull(NaN)).toBe(true);
    });

    it("should be true for null using default valueTypes argument", () => {
        expect(isPrimitiveOrNull(null)).toBe(true);
    });

    it("should be false for null using default valueTypes: number", () => {
        expect(isPrimitiveOrNull(null, [Number])).toBe(false);
    });
});
