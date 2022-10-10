import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { Expansion } from "../../lib/expansion/expansion";

function mergeExpansions(...objects: ExpansionValue[]): boolean | ExpansionValue {
    const rootSchema = new EntitySchema("foo");
    const fooSchema = new EntitySchema("foo");
    const barSchema = new EntitySchema("bar");
    const bazSchema = new EntitySchema("baz");
    fooSchema.addRelationProperty("bar", barSchema, "barId", "id").addRelationProperty("baz", bazSchema, "bazId", "id");
    rootSchema.addRelationProperty("foo", fooSchema, "fooId", "id");

    return Expansion.mergeValues(rootSchema, ...objects);
}

describe("mergeExpansions()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: ExpansionValue = { foo: true };
        const b: ExpansionValue = { bar: true };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: ExpansionValue = { foo: { bar: true } };
        const b: ExpansionValue = { foo: { baz: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: ExpansionValue = { foo: true };
        const b: ExpansionValue = { foo: { bar: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});
