import { inSet, matches } from "@entity-space/criteria";
import { EntitySchema } from "../schema/entity-schema";
import { EntityStoreV2 } from "./entity-store-v2";
import { EntityType } from "./entity-type";

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

        expect(store.getByCriterion(matches<Foo>({ name: inSet(["1st", "2nd"]) }))).toEqual([
            { id: 1, name: "1st" },
            { id: 4, name: "1st" },
            { id: 2, name: "2nd" },
        ]);

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

        expect(store.getByCriterion(matches<Foo>({ name: inSet(["1st", "2nd"]) }))).toEqual([
            { id: 1, name: "1st" },
            { id: 2, name: "2nd" },
            { id: 4, name: "2nd" },
        ]);
    });
});
