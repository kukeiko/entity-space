import { EntityType } from "../entity/entity-type";
import { EntitySchema } from "../schema/entity-schema";
import { EntityStoreV3 } from "./entity-store-v3";

interface Vector {
    x: number;
    y: number;
    z: number;
}

interface Block {
    position: Vector;
    typeId: string;
}

describe("entity-store-v3", () => {
    fit("should work", () => {
        // arrange
        const entitySchema = new EntitySchema("block");
        entitySchema.setKey(["position.x", "position.y", "position.z"], { name: "id" });
        entitySchema.addIndex(["position.x", "position.z"]);
        entitySchema.addIndex("position.x");
        entitySchema.addIndex("position.y");
        entitySchema.addIndex("position.z");
        entitySchema.addIndex("typeId");
        const entityType = new EntityType(entitySchema);
        const entityStore = new EntityStoreV3(entityType);

        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
        ];

        // act
        entityStore.add(blocks);
        const fetched = blocks.map(block => entityStore.get(block));

        // assert
        expect(fetched).toEqual(blocks);
        blocks.forEach((block, index) => expect(fetched[index]).not.toBe(block));
    });

    fit("should work #2", () => {
        // arrange
        const entitySchema = new EntitySchema("block");
        entitySchema.setKey(["position.x", "position.y", "position.z"], { name: "id" });
        entitySchema.addIndex(["position.x", "position.z"]);
        entitySchema.addIndex("position.x");
        entitySchema.addIndex("position.y");
        entitySchema.addIndex("position.z");
        entitySchema.addIndex("typeId");
        const entityType = new EntityType(entitySchema);
        const entityStore = new EntityStoreV3(entityType);

        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" },
        ];

        const expected: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
        ];

        // act
        entityStore.add(blocks);
        const fetched = expected.map(block => entityStore.get(block));

        // assert
        expect(fetched).toEqual(expected);
        blocks.forEach((block, index) => expect(fetched[index]).not.toBe(block));
    });
});
