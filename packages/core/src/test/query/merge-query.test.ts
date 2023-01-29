import { EntitySchema } from "../../lib/schema/entity-schema";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";
import { expectQuery } from "../tools/expect-query.fn";

describe("mergeQuery()", () => {
    const schemas = new EntitySchemaCatalog();
    const songSchema = new EntitySchema("song");
    const fooSchema = new EntitySchema("foo");
    const barSchema = new EntitySchema("bar");
    schemas.addSchema(songSchema);
    schemas.addSchema(fooSchema);
    schemas.addSchema(barSchema);
    fooSchema.addRelationProperty("bar", barSchema, "barId", "id");

    expectQuery("foo", schemas).plus("foo/{ bar }").toBe("foo/{ bar }");
    expectQuery("foo", schemas).plus("song").toBe(false);
    expectQuery(`foo<{ searchText: "bar" }>`, schemas).plus(`foo<{ searchText: "baz" }>`).toBe(false);

    expectQuery("foo({ id: 7 })", schemas).plus("foo({ id: 3 })").toBe("foo({ id: { 7, 3 } })");
    expectQuery("foo({ id: 7 })", schemas).plus("foo({ artistId: 13 })").toBe("foo({ id: 7 } | { artistId: 13 })");
    expectQuery("foo({ id: 7 })/{ id, name }", schemas)
        .plus("foo({ artistId: 13 })/{ id, name }")
        .toBe("foo({ id: 7 } | { artistId: 13 })/{ id, name }");

    expectQuery("foo({ id: 7 })/{ id, name }", schemas).plus("foo({ artistId: 13 })/{ id }").toBe(false);

    expectQuery("foo({ id: 7 })/{ id, name }", schemas).plus("foo({ id: 3 })/{ id }").toBe(false);

    expectQuery("foo({ price: [100, 200], rating: [3, 8] })/{ foo }", schemas)
        .plus("foo({ price: [100, 200], rating: [3, 8] })/{ bar }")
        .toBe("foo({ price: [100, 200], rating: [3, 8] })/{ foo, bar }");

    expectQuery("foo({ price: [100, 200], rating: [3, 8] })/{ foo }", schemas)
        .plus("foo({ price: [100, 200], rating: [3, 8] })/{ foo }")
        .toBe("foo({ price: [100, 200], rating: [3, 8] })/{ foo }");

    describe("paging", () => {
        {
            // A & B equal
            expectQuery("song({ artistId: 7 })[0, 10]", schemas)
                .plus("song({ artistId: 7 })[0, 10]")
                .toBe("song({ artistId: 7 })[0, 10]");
        }

        {
            // A & B equivalent
            expectQuery("song({ artistId: { 7 } })[0, 10]", schemas)
                .plus("song({ artistId: 7 })[0, 10]")
                .toBe("song({ artistId: { 7 } })[0, 10]");
        }

        {
            // A has paging, B has not
            expectQuery("song({ id: 7 })[0, 10]", schemas).plus("song({ id: 7 })").toBe("song({ id: 7 })");
            expectQuery("song({ id: { 7 } })[0, 10]", schemas).plus("song({ id: 7 })").toBe("song({ id: 7 })");
            expectQuery("song({ id: 7 })[0, 10]", schemas).plus("song({ id: 8 })").toBe(false);
        }

        {
            // B has paging, A has not
            expectQuery("song({ id: 7 })", schemas).plus("song({ id: 7 })[0, 10]").toBe("song({ id: 7 })");
            expectQuery("song({ id: { 7 } })", schemas).plus("song({ id: 7 })[0, 10]").toBe("song({ id: { 7 } })");

            expectQuery("song({ id: 7 })/{ id }", schemas)
                .plus("song({ id: 7 })[0, 10]/{ id }")
                .toBe("song({ id: 7 })/{ id }");

            expectQuery("song({ id: 7 })", schemas).plus("song({ id: 8 })[0, 10]").toBe(false);
        }

        // A & B have paging
        {
            expectQuery("song({ id: 7 })[0, 10]", schemas)
                .plus("song({ id: 7 })[0, 20]")
                .toBe("song({ id: 7 })[0, 20]");

            expectQuery("song({ id: 7 })[0, 10]", schemas)
                .plus("song({ id: 7 })[11, 20]")
                .toBe("song({ id: 7 })[0, 20]");

            expectQuery("song({ artistId: 7 })[0, 10]", schemas).plus("song({ artistId: 7 })[12, 20]").toBe(false);
            expectQuery("song({ artistId: 7 })[name, 0, 10]", schemas)
                .plus("song({ artistId: 7 })[artist.name, 0, 10]")
                .toBe(false);

            expectQuery("song({ artistId: 7 })[0, 10]/{ id }", schemas)
                .plus("song({ artistId: 7 })[0, 10]/{ name }")
                .toBe("song({ artistId: 7 })[0, 10]/{ id, name }");

            expectQuery("song({ artistId: 7 })[0, 10]/{ id }", schemas)
                .plus("song({ artistId: 7 })[0, 11]/{ name }")
                .toBe(false);

            expectQuery("song({ artistId: 7 })[0, 10]", schemas)
                .plus("song({ artistId: { 7, 9 } })[0, 10]")
                .toBe(false);
        }
    });
});
