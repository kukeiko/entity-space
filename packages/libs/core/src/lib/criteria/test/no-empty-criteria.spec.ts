import { and, inRange, matches, or, NamedCriteria } from "../criterion";

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
