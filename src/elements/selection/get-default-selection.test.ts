import { describe, expect, it } from "vitest";
import { EntityBlueprint } from "../entity/entity-blueprint";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { getDefaultSelection } from "./get-default-selection.fn";

const { register, entity, nullable } = EntityBlueprint;

describe(getDefaultSelection, () => {
    it("should support a recursive schema", () => {
        // arrange
        class Foo {
            // [todo] ❌ making this nullable because it should not be possible to have recursion of required entities
            // where the chain is not broken by at least 1x nullable or 1x arrays. need to implement and write a test for EntitySchema/EntitySchemaCatalog checking for that.
            bar = entity(Bar, { nullable });
            fooKhaz = entity(Khaz);
        }

        register(Foo, { name: "foo" });

        class Bar {
            baz = entity(Baz);
        }

        register(Bar, { name: "bar" });

        class Baz {
            foo = entity(Foo);
        }

        register(Baz, { name: "baz" });

        class Khaz {
            mo = entity(Mo, { nullable });
        }

        register(Khaz, { name: "khaz" });

        class Mo {
            dan = entity(Dan);
        }

        register(Mo, { name: "mo" });

        class Dan {
            khaz = entity(Khaz);
        }

        register(Dan, { name: "dan" });

        const catalog = new EntitySchemaCatalog();
        const fooSchema = catalog.getSchemaByBlueprint(Foo);
        const expected = {
            bar: {
                baz: {
                    foo: {
                        bar: {},
                        fooKhaz: { mo: { dan: { khaz: { mo: {} } } } },
                    },
                },
            },
            fooKhaz: { mo: { dan: { khaz: { mo: {} } } } },
        };

        expected.bar.baz.foo.bar = expected.bar;
        expected.bar.baz.foo.fooKhaz.mo.dan.khaz.mo = expected.bar.baz.foo.fooKhaz.mo;
        expected.fooKhaz.mo.dan.khaz.mo = expected.fooKhaz.mo;

        // act
        const actual = getDefaultSelection(fooSchema);

        // assert
        expect(actual).toEqual(expected);
    });
});
