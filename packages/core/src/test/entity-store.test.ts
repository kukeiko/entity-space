import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntityStore } from "../lib/execution/store/entity-store";
import { EntitySchema } from "../lib/schema/entity-schema";
import { EntitySchemaCatalog } from "../lib/schema/entity-schema-catalog";
import { Color, ColorBlueprint, MinecraftBlock, MinecraftBlockBlueprint } from "./content";

describe(EntityStore.name, () => {
    const criteriaTools = new EntityCriteriaTools();
    const { where } = criteriaTools;

    describe(EntityStore.prototype.add.name, () => {
        it("should allow adding entities", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();
            const entitySchema = catalog.resolve(ColorBlueprint);
            const entityStore = new EntityStore(entitySchema);

            const colors: Color[] = [{ id: 1, name: "Red" }];
            const expected: Color[] = [{ id: 1, name: "Red" }];

            // act
            entityStore.add(colors);
            const actual = expected.map(block => entityStore.get(block));

            // assert
            expect(actual).toEqual(expected);
            colors.forEach((color, index) => expect(actual[index]).not.toBe(color));
        });

        it("should allow adding using a complex key", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();
            const entitySchema = catalog.resolve(MinecraftBlockBlueprint);
            const entityStore = new EntityStore(entitySchema);

            const blocks: MinecraftBlock[] = [
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: 1, z: 0 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: 2, z: 0 }, typeId: "minecraft:dirt" },
            ];

            const expected: MinecraftBlock[] = [
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: 1, z: 0 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: 2, z: 0 }, typeId: "minecraft:dirt" },
            ];

            // act
            entityStore.add(blocks);
            const fetched = expected.map(block => entityStore.get(block));

            // assert
            expect(fetched).toEqual(expected);
            blocks.forEach((block, index) => expect(fetched[index]).not.toBe(block));
        });

        it("should allow adding duplicates and merges them", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();
            const entitySchema = catalog.resolve(MinecraftBlockBlueprint);
            const entityStore = new EntityStore(entitySchema);

            const blocks: MinecraftBlock[] = [
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: 1, z: 0 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" }, // same id as first element (with a change in typeId)
            ];

            const expected: MinecraftBlock[] = [
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: 1, z: 0 }, typeId: "minecraft:dirt" },
            ];

            // act
            entityStore.add(blocks);
            const fetched = expected.map(block => entityStore.get(block));

            // assert
            expect(fetched).toEqual(expected);
            blocks.forEach((block, index) => expect(fetched[index]).not.toBe(block));
        });
    });

    describe(EntityStore.prototype.getByCriterion.name, () => {
        it("should return entities filtered by a criterion", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();
            const entitySchema = catalog.resolve(MinecraftBlockBlueprint);
            const entityStore = new EntityStore(entitySchema);
            const criteriaFactory = new EntityCriteriaTools();

            const blocks: MinecraftBlock[] = [
                { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: 0, z: 1 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: 0, z: 2 }, typeId: "minecraft:grass_block" },
                { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: -1, z: 1 }, typeId: "minecraft:dirt" },
                { position: { x: 0, y: -1, z: 2 }, typeId: "minecraft:dirt" },
            ];

            const byTypeId_expected = blocks.filter(block => block.typeId === "minecraft:dirt");
            const byTypeId_criterion = where<MinecraftBlock>({ typeId: "minecraft:dirt" });

            const byXandZ_expected = blocks.filter(block => block.position.x === 0 && block.position.z === 0);
            const byXandZ_criterion = where<MinecraftBlock>({ position: { x: 0, z: 0 } });

            const byXandZ_or_byTypeId_expected = blocks.filter(
                block => block.typeId === "minecraft:dirt" || (block.position.x === 0 && block.position.z === 0)
            );

            const byXandZ_or_byTypeId_criterion = criteriaFactory.or([
                where<MinecraftBlock>({ position: { x: 0, z: 0 } }),
                where<MinecraftBlock>({ typeId: "minecraft:dirt" }),
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

    describe(EntityStore.prototype.getByParameters.name, () => {
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
