import { EntitySchema } from "../lib/schema/entity-schema";
import { matches } from "../lib/criteria/criterion/named/matches.fn";
import { or } from "../lib/criteria/criterion/or/or.fn";
import { isValue } from "../lib/criteria/criterion/value/is-value.fn";
import { EntityStore } from "../lib/entity/store/entity-store";

interface Vector {
    x: number;
    y: number;
    z: number;
}

interface Block {
    position: Vector;
    typeId: string;
}

describe("entity-store", () => {
    it("should work", () => {
        // arrange
        const entitySchema = new EntitySchema("block");
        entitySchema.setKey(["position.x", "position.y", "position.z"], { name: "id" });
        entitySchema.addIndex(["position.x", "position.z"]);
        entitySchema.addIndex("position.x");
        entitySchema.addIndex("position.y");
        entitySchema.addIndex("position.z");
        entitySchema.addIndex("typeId");
        const entityStore = new EntityStore(entitySchema);

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

    it("should work #2", () => {
        // arrange
        const entitySchema = new EntitySchema("block");
        entitySchema.setKey(["position.x", "position.y", "position.z"], { name: "id" });
        entitySchema.addIndex(["position.x", "position.z"]);
        entitySchema.addIndex("position.x");
        entitySchema.addIndex("position.y");
        entitySchema.addIndex("position.z");
        entitySchema.addIndex("typeId");
        const entityStore = new EntityStore(entitySchema);

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

    fit("should get by criterion", () => {
        const entitySchema = new EntitySchema("block");
        entitySchema.setKey(["position.x", "position.y", "position.z"], { name: "id" });
        entitySchema.addIndex(["position.x", "position.z"]);
        entitySchema.addIndex("position.x");
        entitySchema.addIndex("position.y");
        entitySchema.addIndex("position.z");
        entitySchema.addIndex("typeId");
        const entityStore = new EntityStore(entitySchema);

        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: 0, z: 1 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: 0, z: 2 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: -1, z: 1 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: -1, z: 2 }, typeId: "minecraft:dirt" },
        ];

        // act
        entityStore.add(blocks);

        // assert
        expect(
            entityStore.getByCriterion(
                matches<Block>({
                    typeId: isValue("minecraft:dirt"),
                })
            )
        ).toEqual(blocks.filter(block => block.typeId === "minecraft:dirt"));

        expect(
            entityStore.getByCriterion(
                matches<Block>({
                    position: matches<Vector>({ x: isValue(0), z: isValue(0) }),
                })
            )
        ).toEqual(blocks.filter(block => block.position.x === 0 && block.position.z === 0));

        expect(
            entityStore.getByCriterion(
                or([
                    matches<Block>({
                        position: matches<Vector>({ x: isValue(0), z: isValue(0) }),
                    }),
                    matches<Block>({
                        typeId: isValue("minecraft:dirt"),
                    }),
                ])
            )
        ).toEqual(
            blocks.filter(
                block => block.typeId === "minecraft:dirt" || (block.position.x === 0 && block.position.z === 0)
            )
        );
    });
});
