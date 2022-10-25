import { EntitySchema, EntitySchemaCatalog } from "@entity-space/common";
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

    expectQuery("foo({ price: [100, 200], rating: [3, 8] })/{ foo }", schemas)
        .plus("foo({ price: [100, 200], rating: [3, 8] })/{ bar }")
        .toBe("foo({ price: [100, 200], rating: [3, 8] })/{ foo, bar }");

    expectQuery("foo({ price: [100, 200], rating: [3, 8] })/{ foo }", schemas)
        .plus("foo({ price: [100, 200], rating: [3, 8] })/{ foo }")
        .toBe("foo({ price: [100, 200], rating: [3, 8] })/{ foo }");

    expectQuery("song({ artistId: 7 })[0, 10]", schemas)
        .plus("song({ artistId: 7 })[0, 10]")
        .toBe("song({ artistId: 7 })[0, 10]");

    expectQuery("song({ artistId: 7 })[0, 10]", schemas)
        .plus("song({ artistId: 7 })[0, 20]")
        .toBe("song({ artistId: 7 })[0, 20]");

    expectQuery("song({ artistId: 7 })[0, 10]", schemas)
        .plus("song({ artistId: 7 })[11, 20]")
        .toBe("song({ artistId: 7 })[0, 20]");

    expectQuery("song({ artistId: 7 })[0, 10]", schemas).plus("song({ artistId: 7 })[12, 20]").toBe(false);

    expectQuery("song({ artistId: 7 })[0, 10]/{ id }", schemas)
        .plus("song({ artistId: 7 })[0, 10]/{ name }")
        .toBe("song({ artistId: 7 })[0, 10]/{ id, name }");

    expectQuery("song({ artistId: 7 })[0, 10]", schemas).plus("song({ artistId: { 7, 9 } })[0, 10]").toBe(false);
});
