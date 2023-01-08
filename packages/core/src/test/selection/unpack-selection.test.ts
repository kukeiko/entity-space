import { EntitySchema, PackedEntitySelection, UnpackedEntitySelection } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";

describe("EntitySelection.unpack()", () => {
    it("should unpack 'true' to the default selection", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
            color?: string;
            bar: Bar;
        }

        interface Bar {
            key: number;
            index: number;
            description?: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name", true).addString("color");
        const barSchema = new EntitySchema("bar")
            .addInteger("key", true)
            .addInteger("index", true)
            .addString("description");

        fooSchema.addProperty("bar", barSchema, true);

        const packed: PackedEntitySelection<Foo> = true;
        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
            bar: {
                key: true,
                index: true,
            },
        };

        // act
        const actual = EntitySelection.unpack(fooSchema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should unpack partial selection containing only already required properties to the default selection", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
            color?: string;
            bar: Bar;
        }

        interface Bar {
            key: number;
            index: number;
            description?: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name", true).addString("color");
        const barSchema = new EntitySchema("bar")
            .addInteger("key", true)
            .addInteger("index", true)
            .addString("description");

        fooSchema.addProperty("bar", barSchema, true);

        const packed: PackedEntitySelection<Foo> = { id: true, bar: true };

        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
            bar: {
                key: true,
                index: true,
            },
        };

        // act
        const actual = EntitySelection.unpack(fooSchema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should unpack 'true' on a property that is an entity to that entities' default selection", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
            baz?: Baz;
        }

        interface Baz {
            id: string;
            description: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name", true);
        const bazSchema = new EntitySchema("baz").addString("id", true).addString("description", true);

        fooSchema.addProperty("baz", bazSchema);

        const packed: PackedEntitySelection<Foo> = {
            baz: true,
        };
        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
            baz: {
                id: true,
                description: true,
            },
        };

        // act
        const actual = EntitySelection.unpack(fooSchema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should merge a selection on a property that is an entity", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
            color?: string;
            bar: Bar;
        }

        interface Bar {
            key: number;
            index: number;
            description?: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name", true).addString("color");
        const barSchema = new EntitySchema("bar")
            .addInteger("key", true)
            .addInteger("index", true)
            .addString("description");

        fooSchema.addProperty("bar", barSchema, true);

        const packed: PackedEntitySelection<Foo> = {
            bar: { description: true },
        };
        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
            bar: {
                key: true,
                index: true,
                description: true,
            },
        };

        // act
        const actual = EntitySelection.unpack(fooSchema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should copy over 'true' for optional primitive properties", () => {
        // arrange
        interface Foo {
            id: number;
            name?: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name");

        const packed: PackedEntitySelection<Foo> = {
            id: true,
            name: true,
        };
        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
        };

        // act
        const actual = EntitySelection.unpack(fooSchema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should ignore falsy properties", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
        }

        const schema = new EntitySchema("foo").addInteger("id", true).addString("name", true);
        const packed: PackedEntitySelection<Foo> = {
            id: true,
            name: void 0,
        };
        const expected: UnpackedEntitySelection<Foo> = {
            id: true,
            name: true,
        };

        // act
        const actual = EntitySelection.unpack(schema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should just copy over properties not defined in the schema", () => {
        // arrange
        interface NotFullyDescribed {
            id: number;
            name: string;
            notInSchema?: string;
        }

        const schema = new EntitySchema("not-fully-described").addInteger("id", true).addString("name", true);
        const packed: PackedEntitySelection<NotFullyDescribed> = {
            id: true,
            notInSchema: true,
        };
        const expected: UnpackedEntitySelection<NotFullyDescribed> = {
            id: true,
            name: true,
            notInSchema: true,
        };

        // act
        const actual = EntitySelection.unpack(schema, packed);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should throw an error if a primitive property is set to anything other than 'true'", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
        }

        const fooSchema = new EntitySchema("foo").addInteger("id", true).addString("name", true);
        const invalidPacked: PackedEntitySelection<Foo> = {
            id: {} as any,
            name: [] as any,
        };

        // assert
        expect(() => EntitySelection.unpack(fooSchema, invalidPacked)).toThrow();
    });
});
