import { NamedCriteria } from "../lib/criterion/named/named-criteria";

describe("throwing tests", () => {
    it("should throw when trying to instantiate empty NamedCriteria", () => {
        const create = () => new NamedCriteria({});
        expect(create).toThrow();
    });
});
