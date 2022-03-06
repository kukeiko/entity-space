import { inSet, matches } from "@entity-space/criteria";
import { EntitySchema } from "../schema/entity-schema";
import { EntitySchemaIndex } from "../schema/entity-schema-index";
import { EntityCompositeValueIndex } from "./entity-composite-value-index";
import { IEntityIndex } from "./entity-index.interface";
import { EntityPrimitiveValueIndex } from "./entity-primitive-value-index";
import { EntityStoreIndexV2 } from "./entity-store-index-v2";

function createIndex(path: string | string[], unique = false): EntityStoreIndexV2 {
    const entitySchema = new EntitySchema("foo");
    const indexSchema = new EntitySchemaIndex(entitySchema, path, { unique });

    let index: IEntityIndex;

    if (typeof path === "string" || path.length === 1) {
        index = new EntityPrimitiveValueIndex(indexSchema);
    } else {
        index = new EntityCompositeValueIndex(indexSchema);
    }

    return new EntityStoreIndexV2(index);
}

describe("entity-store-index", () => {
    it("should work", () => {
        // arrange
        interface Foo {
            id: number;
            name: string;
        }
        const entities: Foo[] = [
            { id: 1, name: "1st" },
            { id: 2, name: "2nd" },
            { id: 3, name: "3rd" },
        ];

        const indexedValues: number[] = [0, 1, 2];
        const expected = new Set([1]);
        const index = createIndex("id");

        // act
        index.insert(entities, indexedValues);
        const actual = index.get(matches<Foo>({ id: inSet([2]) }));

        // assert
        expect(actual).not.toEqual(false);

        if (actual !== false) {
            expect(actual.values).toEqual(expected);
        }

        expect(index.read(entities)).toEqual([0, 1, 2]);
    });
});
