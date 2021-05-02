import { isFromInsideFromTo, isToInsideFromTo } from "./from-to/reduce-from-to-value-criterion";

describe("[tmp] from-to", () => {
    it("isFromInsideFromTo()", () => {
        expect(isFromInsideFromTo({ op: ">=", value: 3 }, { op: "from-to", from: { op: ">=", value: 3 }, to: { op: "<=", value: 3 } })).toBe(true);
        expect(isFromInsideFromTo({ op: ">=", value: 3 }, { op: "from-to", from: { op: ">=", value: 4 }, to: { op: "<=", value: 5 } })).toBe(false);
        expect(isFromInsideFromTo({ op: ">=", value: 3 }, { op: "from-to", from: { op: ">", value: 3 }, to: { op: "<=", value: 5 } })).toBe(false);
        expect(isFromInsideFromTo({ op: ">", value: 3 }, { op: "from-to", from: { op: ">", value: 3 }, to: { op: "<=", value: 5 } })).toBe(true);
        expect(isFromInsideFromTo({ op: ">", value: 3 }, { op: "from-to", from: { op: ">=", value: 3 }, to: { op: "<=", value: 5 } })).toBe(true);
        expect(isFromInsideFromTo({ op: ">", value: 3 }, { op: "from-to", from: { op: ">=", value: 2 }, to: { op: "<=", value: 5 } })).toBe(true);

        expect(isFromInsideFromTo({ op: ">", value: 3 }, { op: "from-to", from: { op: ">=", value: 1 }, to: { op: "<=", value: 3 } })).toBe(false);
        expect(isFromInsideFromTo({ op: ">=", value: 3 }, { op: "from-to", from: { op: ">=", value: 1 }, to: { op: "<=", value: 3 } })).toBe(true);
        expect(isFromInsideFromTo({ op: ">", value: 4 }, { op: "from-to", from: { op: ">=", value: 1 }, to: { op: "<=", value: 4 } })).toBe(false);
    });

    it("isToInsideFromTo()", () => {
        expect(isToInsideFromTo({ op: "<", value: 3 }, { op: "from-to", from: { op: ">=", value: 3 }, to: { op: "<=", value: 4 } })).toBe(false);
        expect(isToInsideFromTo({ op: "<=", value: 3 }, { op: "from-to", from: { op: ">=", value: 3 }, to: { op: "<=", value: 4 } })).toBe(true);
        expect(isToInsideFromTo({ op: "<=", value: 3 }, { op: "from-to", from: { op: ">", value: 3 }, to: { op: "<=", value: 4 } })).toBe(false);
        expect(isToInsideFromTo({ op: "<=", value: 3 }, { op: "from-to", from: { op: ">", value: 1 }, to: { op: "<=", value: 3 } })).toBe(true);
        expect(isToInsideFromTo({ op: "<=", value: 3 }, { op: "from-to", from: { op: ">", value: 1 }, to: { op: "<", value: 4 } })).toBe(true);
        expect(isToInsideFromTo({ op: "<=", value: 3 }, { op: "from-to", from: { op: ">", value: 1 }, to: { op: "<", value: 3 } })).toBe(false);
    });
});
