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
        const criteriaFactory = new EntityCriteriaTools();

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
                criteriaFactory.where<Block>({
                    typeId: criteriaFactory.equals("minecraft:dirt"),
                })
            )
        ).toEqual(blocks.filter(block => block.typeId === "minecraft:dirt"));

        expect(
            entityStore.getByCriterion(
                criteriaFactory.where<Block>({
                    position: criteriaFactory.where<Vector>({
                        x: criteriaFactory.equals(0),
                        z: criteriaFactory.equals(0),
                    }),
                })
            )
        ).toEqual(blocks.filter(block => block.position.x === 0 && block.position.z === 0));

        expect(
            entityStore.getByCriterion(
                criteriaFactory.or([
                    criteriaFactory.where<Block>({
                        position: criteriaFactory.where<Vector>({
                            x: criteriaFactory.equals(0),
                            z: criteriaFactory.equals(0),
                        }),
                    }),
                    criteriaFactory.where<Block>({
                        typeId: criteriaFactory.equals("minecraft:dirt"),
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
