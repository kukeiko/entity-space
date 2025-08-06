import { describe, expect, it } from "vitest";
import { EntityBlueprint } from "../entity/entity-blueprint";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { AlbumBlueprint, Folder, FolderBlueprint, TreeBlueprint } from "../testing";
import { TypedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { packEntitySelection } from "./pack-entity-selection.fn";

const { id, entity, array, register } = EntityBlueprint;

describe(packEntitySelection, () => {
    it("the packed selection of a default selection is { }", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const schema = catalog.getSchemaByBlueprint(AlbumBlueprint);
        const expected = {};

        // act
        const actual = packEntitySelection(schema, getDefaultSelection(schema));

        // assert
        expect(actual).toEqual(expected);
    });

    it("the packed selection of a default selection is { } (recursive schema)", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const schema = catalog.getSchemaByBlueprint(TreeBlueprint);
        const expected = {};

        // act
        const actual = packEntitySelection(schema, getDefaultSelection(schema));

        // assert
        expect(actual).toEqual(expected);
    });

    it("the packed selection of a default selection is { } (recursive schema, multiple properties)", () => {
        // arrange
        class NodeBlueprint {
            id = id();
            parent = entity(NodeBlueprint);
            children = entity(NodeBlueprint, { array });
        }
        register(NodeBlueprint, { name: "nodes" });

        const catalog = new EntitySchemaCatalog();
        const schema = catalog.getSchemaByBlueprint(NodeBlueprint);
        const expected = {};

        // act
        const actual = packEntitySelection(schema, getDefaultSelection(schema));

        // assert
        expect(actual).toEqual(expected);
    });

    it("packed selection of recursive relation selection", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const schema = catalog.getSchemaByBlueprint(FolderBlueprint);
        const selection = { id: true, name: true, folders: {} } satisfies TypedEntitySelection<Folder>;
        selection.folders = selection;
        const expected = { folders: {} } satisfies TypedEntitySelection<Folder>;
        expected.folders = expected;

        // act
        const actual = packEntitySelection(schema, selection);

        // assert
        expect(actual).toEqual(expected);
    });
});
