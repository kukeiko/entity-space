import { and, inRange, matches, or, PropertyCriteria } from "../criterion";

describe("a criterion can't be empty", () => {
    it("should be true for PropertyCriteria", () => {
        const create = () => new PropertyCriteria({});
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
