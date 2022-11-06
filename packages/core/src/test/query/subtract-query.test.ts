import { EntitySchema, EntitySchemaCatalog } from "@entity-space/common";
import { expectQuery } from "../tools/expect-query.fn";

describe("subtractQuery()", () => {
    const schemas = new EntitySchemaCatalog();
    const rootSchema = new EntitySchema("root");
    const fooSchema = new EntitySchema("foo");
    const barSchema = new EntitySchema("bar");
    const bazSchema = new EntitySchema("baz");
    const moSchema = new EntitySchema("mo");
    const danSchema = new EntitySchema("dan");

    fooSchema.addRelationProperty("bar", barSchema, "barId", "id");
    barSchema.addRelationProperty("baz", bazSchema, "bazId", "id").addRelationProperty("mo", moSchema, "moId", "id");

    moSchema.addRelationProperty("dan", danSchema, "danId", "id");

    rootSchema
        .addRelationProperty("foo", fooSchema, "fooId", "id")
        .addRelationProperty("bar", barSchema, "barId", "id");

    schemas.addSchema(rootSchema);
    schemas.addSchema(fooSchema);
    schemas.addSchema(barSchema);
    schemas.addSchema(bazSchema);
    schemas.addSchema(moSchema);
    schemas.addSchema(danSchema);

    const songSchema = new EntitySchema("song");
    schemas.addSchema(songSchema);

    describe("full subtraction", () => {
        expectQuery("foo({ id: { 1, 2 } })/{ bar }", schemas).minus("foo({ id: { 1, 2, 3 } })/{ bar }").toBe(true);
        expectQuery("root({ id: { 1, 2 } })/{ foo: { bar: { baz, mo: { dan } } } }", schemas)
            .minus("root({ id: { 1, 2, 3 } })/{ foo: { bar: { baz, khaz, mo: { dan, zoo } } } }")
            .toBe(true);

        expectQuery("song({ artistId: 7 })[0, 10]", schemas).minus("song({ artistId: 7 })[0, 10]").toBe(true);
        expectQuery(`song<{ searchText: "foo" }>({ artistId: 7 })[0, 10]`, schemas)
            .minus(`song<{ searchText: "foo" }>({ artistId: 7 })[0, 10]`)
            .toBe(true);

        expectQuery(`song<{ searchText: "foo" }>({ artistId: 7 })`, schemas)
            .minus(`song<{ searchText: "foo" }>({ artistId: { 1, 7 } })`)
            .toBe(true);
    });

    describe("partial subtraction", () => {
        expectQuery("foo({ id: { 1, 2 } })", schemas).minus("foo({ id: { 1 } })").toBe("foo({ id: { 2 } })");

        expectQuery("foo({ id: { 1, 2 } })/{ bar }", schemas)
            .minus("foo({ id: { 1 } })/{ bar }")
            .toBe("foo({ id: { 2 } })/{ bar }");

        expectQuery("root({ id: { 1, 2 } })/{ foo, bar }", schemas)
            .minus("root({ id: { 1, 2 } })/{ foo }")
            .toBe("root({ id: { 1, 2 } })/{ bar }");

        expectQuery("root({ id: { 1, 2 } })/{ foo, bar }", schemas)
            .minus("root({ id: { 1 } })/{ foo }")
            .toBe(["root({ id: { 2 } })/{ foo, bar }", "root({ id: { 1 } })/{ bar }"]);

        expectQuery("root({ index: [1, 7] })", schemas)
            .minus("root({ index: [3, 4] })")
            .toBe("root({ index: [1, 3) | (4, 7] })");

        expectQuery("root({ index: [1, 7] })/{ foo, bar }", schemas)
            .minus("root({ index: [3, 4] })/{ foo }")
            .toBe(["root({ index: [1, 3) | (4, 7] })/{ foo, bar }", "root({ index: [3, 4] })/{ bar }"]);

        expectQuery("root({ index: [1, 7], price: [900, 1300] })", schemas)
            .minus("root({ index: [3, 4], price: [1000, 1200] })")
            .toBe(
                "root({ index: [1, 3) | (4, 7], price: [900, 1300] } | { index: [3, 4], price: [900, 1000) | (1200, 1300] })"
            );

        expectQuery("root({ index: [1, 7], price: [900, 1300] })/{ foo, bar }", schemas)
            .minus("root({ index: [3, 4], price: [1000, 1200] })/{ foo }")
            .toBe([
                "root({ index: [1, 3) | (4, 7], price: [900, 1300] } | { index: [3, 4], price: [900, 1000) | (1200, 1300] })/{ foo, bar }",
                "root({ index: [3, 4], price: [1000, 1200] })/{ bar }",
            ]);

        // [todo] a bit surprised about this one.
        // it effectively tests that subtractQuery() does not do simplification by using mergeQuery()
        // but maybe that is something we want it to do by default?
        expectQuery("root({ price: [100, 300], rating: [3, 7] })", schemas)
            .minus("root({ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] })")
            .toBe("root({ price: (200, 300], rating: (5, 7] } | { price: [100, 200], rating: (5, 7] })");

        expectQuery("song({ artistId: 7 })[0, 10]", schemas)
            .minus("song({ artistId: 7 })[0, 5]")
            .toBe("song({ artistId: 7 })[6, 10]");

        expectQuery("song({ artistId: 7 })[0, 10]", schemas)
            .minus("song({ artistId: 7 })[3, 5]")
            .toBe(["song({ artistId: 7 })[0, 2]", "song({ artistId: 7 })[6, 10]"]);

        expectQuery("song({ artistId: 7 })[0, 10]/{ id, name }", schemas)
            .minus("song({ artistId: 7 })[0, 5]/{ id }")
            .toBe(["song({ artistId: 7 })[6, 10]/{ id, name }", "song({ artistId: 7 })[0, 5]/{ name }"]);

        expectQuery(`foo<{ searchText: { "bar", "baz" } }>`, schemas)
            .minus(`foo<{ searchText: "baz" }>`)
            .toBe(`foo<{ searchText: { "bar" } }>`);

        expectQuery(`song<{ searchText: { "bar", "baz" } }>({ artistId: 7 })`, schemas)
            .minus(`song<{ searchText: "baz" }>`)
            .toBe(`song<{ searchText: { "bar" } }>({ artistId: 7 })`);

        expectQuery(`song<{ searchText: { "bar", "baz" } }>({ artistId: { 7, 9 } })`, schemas)
            .minus(`song<{ searchText: "baz" }>({ artistId: 7 })`)
            .toBe([
                `song<{ searchText: { "bar" } }>({ artistId: { 7, 9 } })`,
                `song<{ searchText: "baz" }>({ artistId: { 9 } })`,
            ]);
    });

    describe("no subtraction", () => {
        expectQuery("root({ id: { 1, 2 } })/{ foo }", schemas).minus("root({ id: 1 })").toBe(false);
        expectQuery("song({ artistId: { 7, 9 } })[0, 10]", schemas).minus("song({ artistId: 7 })[0, 10]").toBe(false);
        expectQuery(`song<{ searchText: "foo" }>({ artistId: 7 })[0, 10]`, schemas)
            .minus(`song<{ searchText: "bar" }>({ artistId: 7 })[0, 10]`)
            .toBe(false);

        expectQuery(`song<{ searchText: "foo" }>({ artistId: 7 })[0, 10]`, schemas)
            .minus(`song<{ searchText: "foo" }>({ artistId: { 1, 7 } })[0, 10]`)
            .toBe(false);

        expectQuery("foo({ id: 1 })", schemas).minus("root({ id: 1 })[0, 10]").toBe(false);
        expectQuery("foo[0, 10]", schemas).minus("root[12, 20]").toBe(false);
        expectQuery("foo({ id: 1 })[0, 10]/{ id }", schemas).minus("root({ id: 1 })[0, 10]/{ name }").toBe(false);
        expectQuery(`foo<{ searchText: { "bar", "baz" } }>[0, 10]`, schemas)
            .minus(`foo<{ searchText: "baz" }>[0, 10]`)
            .toBe(false);
    });
});
