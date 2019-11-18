import { Attribute, allAttributes, hasAttribute } from "@sandbox-8";

describe("attribute.ts", () => {
    it("allAttributes() should contain all the attributes shipped with entity-space", () => {
        let expected: Attribute[] = ["filterable", "iterable", "unique"];
        let actual = allAttributes();

        expected.sort();
        actual.sort();

        expect(actual).toEqual(expected);
    });

    it("hasAttribute() should return true if object extends { [attribute]: true }", () => {
        let hasIterableAttribute = {
            iterable: true
        };

        expect(hasAttribute(hasIterableAttribute, "iterable"))
            .toBe(true, `expected '${JSON.stringify(hasIterableAttribute)}' to have a property named 'iterable' set to true`);
    });
});
