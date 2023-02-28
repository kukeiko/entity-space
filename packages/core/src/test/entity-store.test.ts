import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntityStore } from "../lib/entity/store/entity-store";
import { EntitySchema } from "../lib/schema/entity-schema";

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
    const criteriaTools = new EntityCriteriaTools();
    const { where } = criteriaTools;

    it("should work", () => {
        // arrange
        const entitySchema = new EntitySchema("block")
            .setKey(["position.x", "position.y", "position.z"], { name: "id" })
            .addIndex(["position.x", "position.z"])
            .addIndex("position.x")
            .addIndex("position.y")
            .addIndex("position.z")
            .addIndex("typeId");

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

    it("should get by criterion", () => {
        const entitySchema = new EntitySchema("block")
            .setKey(["position.x", "position.y", "position.z"], { name: "id" })
            .addIndex(["position.x", "position.z"])
            .addIndex("position.x")
            .addIndex("position.y")
            .addIndex("position.z")
            .addIndex("typeId");

        const entityStore = new EntityStore(entitySchema);
        const criteriaFactory = new EntityCriteriaTools();

        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: 0, z: 1 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: 0, z: 2 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: -1, z: 1 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: -1, z: 2 }, typeId: "minecraft:dirt" },
        ];

        const byTypeId_expected = blocks.filter(block => block.typeId === "minecraft:dirt");
        const byTypeId_criterion = where<Block>({ typeId: "minecraft:dirt" });

        const byXandZ_expected = blocks.filter(block => block.position.x === 0 && block.position.z === 0);
        const byXandZ_criterion = where<Block>({ position: { x: 0, z: 0 } });

        const byXandZ_or_byTypeId_expected = blocks.filter(
            block => block.typeId === "minecraft:dirt" || (block.position.x === 0 && block.position.z === 0)
        );

        const byXandZ_or_byTypeId_criterion = criteriaFactory.or([
            where<Block>({ position: { x: 0, z: 0 } }),
            where<Block>({ typeId: "minecraft:dirt" }),
        ]);

        // act
        entityStore.add(blocks);
        const byTypeId_actual = entityStore.getByCriterion(byTypeId_criterion);
        const byXandZ_actual = entityStore.getByCriterion(byXandZ_criterion);
        const byXandZ_or_byTypeId_actual = entityStore.getByCriterion(byXandZ_or_byTypeId_criterion);

        // assert
        expect(byTypeId_actual).toEqual(byTypeId_expected);
        expect(byXandZ_actual).toEqual(byXandZ_expected);
        expect(byXandZ_or_byTypeId_actual).toEqual(byXandZ_or_byTypeId_expected);
    });
});
