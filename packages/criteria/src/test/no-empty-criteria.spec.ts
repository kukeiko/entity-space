import { and } from "../lib/criterion/and/and.fn";
import { matches } from "../lib/criterion/named/matches.fn";
import { NamedCriteria } from "../lib/criterion/named/named-criteria";
import { or } from "../lib/criterion/or/or.fn";
import { inRange } from "../lib/criterion/range/in-range.fn";

describe("a criterion can't be empty", () => {
    it("should be true for NamedCriteria", () => {
        const create = () => new NamedCriteria({});
        expect(create).toThrow();
    });

    it("should be true for inRange()", () => {
        const create = () => inRange();
        expect(create).toThrow();
    });

    it("should be true for or()", () => {
        const create = () => or();
        expect(create).toThrow();
    });

    it("should be true for and()", () => {
        const create = () => and();
        expect(create).toThrow();
    });

    it("should be true for matches()", () => {
        const create = () => matches({});
        expect(create).toThrow();
    });
});
