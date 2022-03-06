import { EntitySchema } from "../schema/entity-schema";
import { EntitySchemaIndex } from "../schema/entity-schema-index";
import { EntityCompositeValueIndex } from "./entity-composite-value-index";
import { IEntityIndex } from "./entity-index.interface";
import { EntityPrimitiveValueIndex } from "./entity-primitive-value-index";
import { EntityStoreIndexV2 } from "./entity-store-index-v2";
import { EntityStoreV2 } from "./entity-store-v2";
import { EntityType } from "./entity-type";

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

describe("entity-store", () => {
    it("should work", () => {
        // arrange
        const entitySchema = new EntitySchema("foo");
        entitySchema.setKey("id");
        entitySchema.addIndex("name");
        const entityType = new EntityType(entitySchema);
        const store = new EntityStoreV2(entityType);

        interface Foo {
            id: number;
            name: string;
        }

        const entities: Foo[] = [
            { id: 1, name: "1st" },
            { id: 2, name: "2nd" },
            { id: 3, name: "3rd" },
            { id: 4, name: "1st" },
        ];

        // act

        store.upsert(entities);

        // assert
        expect(store.getIndex("id").getIndexed()).toEqual(
            new Map([
                [1, new Set([0])],
                [2, new Set([1])],
                [3, new Set([2])],
                [4, new Set([3])],
            ])
        );

        expect(store.getIndex("name").getIndexed()).toEqual(
            new Map([
                ["1st", new Set([0, 3])],
                ["2nd", new Set([1])],
                ["3rd", new Set([2])],
            ])
        );

        // act
        store.upsert([{ id: 4, name: "2nd" }]);

        // assert
        expect(store.getIndex("id").getIndexed()).toEqual(
            new Map([
                [1, new Set([0])],
                [2, new Set([1])],
                [3, new Set([2])],
                [4, new Set([3])],
            ])
        );

        expect(store.getIndex("name").getIndexed()).toEqual(
            new Map([
                ["1st", new Set([0])],
                ["2nd", new Set([1, 3])],
                ["3rd", new Set([2])],
            ])
        );
    });
});
