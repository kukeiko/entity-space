import { Selection, isSelectionSupersetOf } from "src";

describe("isSelectionSupersetOf()", () => {
    it("{ foo: true, bar: true } should be a superset of { foo: true }", () => {
        // arrange
        const a: Selection = { foo: true, bar: true };
        const b: Selection = { foo: true };

        // act
        const isSuperset = isSelectionSupersetOf(a, b);

        // assert
        expect(isSuperset).toBeTrue();
    });
});
