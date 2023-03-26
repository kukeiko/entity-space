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

    describe("add() & get()", () => {
        it("should allow adding and getting entities", () => {
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
    });

    describe("getByCriterion()", () => {
        it("should return entities filtered by criterion", () => {
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

    describe("getByParameters()", () => {
        it("should return entities filtered by parameters", () => {
            // arrange
            const entitySchema = new EntitySchema("foo").setKey("id").addInteger("id", true);
            const store = new EntityStore(entitySchema);

            interface Foo {
                id: number;
            }

            const entitiesByParameters: Foo[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const extraEntities: Foo[] = [{ id: 4 }, { id: 5 }];
            const expected: Foo[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const parameters = { searchText: "bar" };

            // act
            store.add(entitiesByParameters, parameters);
            store.add(extraEntities);

            const fetched = store.getByParameters(parameters);

            // assert
            expect(fetched).toEqual(expected);
            entitiesByParameters.forEach((entity, index) => expect(fetched[index]).not.toBe(entity));
        });

        it("should return entities filtered by parameters + criterion", () => {
            // arrange
            const entitySchema = new EntitySchema("foo").setKey("id").addInteger("id", true);
            const store = new EntityStore(entitySchema);

            interface Foo {
                id: number;
            }

            const entitiesByParameters: Foo[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const extraEntities: Foo[] = [{ id: 4 }, { id: 5 }];
            const expected: Foo[] = [{ id: 2 }];
            const parameters = { searchText: "bar" };

            // act
            store.add(entitiesByParameters, parameters);
            store.add(extraEntities);

            const fetched = store.getByParameters(parameters, where({ id: [2, 5] }));

            // assert
            expect(fetched).toEqual(expected);
            entitiesByParameters.forEach((entity, index) => expect(fetched[index]).not.toBe(entity));
        });
    });

    it("add() should dedupe when using parameters", () => {
        // arrange
        const entitySchema = new EntitySchema("foo").setKey("id").addInteger("id", true);
        const store = new EntityStore(entitySchema);

        interface Foo {
            id: number;
        }

        const entitiesByParameters: Foo[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const duplicates: Foo[] = [{ id: 2 }];
        const expected: Foo[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const parameters = { searchText: "bar" };

        // act
        store.add(entitiesByParameters, parameters);
        store.add(duplicates, parameters);

        const fetched = store.getByParameters(parameters);

        // assert
        expect(fetched).toEqual(expected);
        entitiesByParameters.forEach((entity, index) => expect(fetched[index]).not.toBe(entity));
    });
});
