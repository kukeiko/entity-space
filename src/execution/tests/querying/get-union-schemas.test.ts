import {
    BiomeBlueprint,
    CharacterBlueprint,
    FactionBlueprint,
    GameObject,
    GameObjectBlueprint,
    OreBlueprint,
    PlantBlueprint,
    Scene,
    SceneBlueprint,
    Shape,
    ShapeBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("get()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should work (shapes)", async () => {
        // arrange
        const id = 7;
        const shape: Shape = { id, type: "circle", radius: 7 };
        repository
            .useShapes()
            .useEntities({ shapes: [shape] })
            .useLoadShapeById();

        // act
        const actual = await workspace.from(ShapeBlueprint).where({ id }).getOne();

        // asserts
        expect(actual).toStrictEqual(shape);
    });

    it("can hydrate a relation common to all members of the union", async () => {
        // arrange
        const sceneId = 1;
        const scene: Scene = facade.construct(SceneBlueprint, { id: sceneId, name: "Dunes and Oases" });
        // [todo] ❌ use workspace.from(GameObject).construct(...) once it supports unions
        const character = facade.construct(CharacterBlueprint, { id: 10, sceneId, type: "character", name: "Worker" });
        const dunesBiome = facade.construct(BiomeBlueprint, { id: 20, sceneId, type: "biome", name: "Dunes" });
        const oasesBiome = facade.construct(BiomeBlueprint, { id: 21, sceneId, type: "biome", name: "Oases" });

        const gameObjects: GameObject[] = [character, dunesBiome, oasesBiome];
        const expected: GameObject[] = [
            { ...character, scene },
            { ...dunesBiome, scene },
            { ...oasesBiome, scene },
        ];
        repository.useGameObjects().useEntities({ gameObjects, scenes: [scene] });
        repository.useGameObjects().useLoadSceneById();
        repository.useGameObjects().useLoadAllGameObjects();

        // act
        const actual = await workspace.from(GameObjectBlueprint).select({ scene: true }).get();
        const actualFromCache = await workspace.from(GameObjectBlueprint).select({ scene: true }).cache(true).get();

        // assert
        expect(actual).toStrictEqual(expected);
        expect(actualFromCache).toStrictEqual(expected);
    });

    describe("can hydrate a relation that exists only on one member of the union", async () => {
        let expected: GameObject[];

        beforeEach(() => {
            // arrange
            // [todo] ❌ use workspace.from(GameObject).construct(...) once it supports unions
            const character = facade.construct(CharacterBlueprint, {
                id: 10,
                type: "character",
                name: "Worker",
                factionId: 30,
            });
            const faction = facade.construct(FactionBlueprint, { id: 30, type: "faction", name: "Empire" });
            const dunesBiome = facade.construct(BiomeBlueprint, { id: 20, type: "biome", name: "Dunes" });
            const gameObjects: GameObject[] = [character, faction, dunesBiome];
            expected = [{ ...character, faction: { ...faction } }, { ...faction }, { ...dunesBiome }];
            repository.useGameObjects().useEntities({ gameObjects });
        });

        it("using two separate sources", async () => {
            repository.useGameObjects().useLoadAllGameObjects();
            repository.useGameObjects().useLoadAllFactions();

            // act
            const actual = await workspace.from(GameObjectBlueprint).select({ faction: true }).get();
            const actualFromCache = await workspace
                .from(GameObjectBlueprint)
                .select({ faction: true })
                .cache(true)
                .get();

            // assert
            expect(actual).toStrictEqual(expected);
            expect(actualFromCache).toStrictEqual(expected);
        });

        it("using one source that includes relation", async () => {
            // using source that includes relation
            repository.useGameObjects().useLoadAllGameObjects({ factions: true });

            // act
            const actual = await workspace.from(GameObjectBlueprint).select({ faction: true }).get();
            const actualFromCache = await workspace
                .from(GameObjectBlueprint)
                .select({ faction: true })
                .cache(true)
                .get();

            // assert
            // [todo] ❌ use "toStrictEqual()" everywhere, as only that caught that a hydration was done when it shouldn't
            expect(actual).toStrictEqual(expected);
            expect(actualFromCache).toStrictEqual(expected);
        });
    });

    it("can hydrate a union relation", async () => {
        // arrange
        // [todo] ❌ use workspace.from(GameObject).construct(...) once it supports unions
        const biome = facade.construct(BiomeBlueprint, {
            id: 10,
            type: "biome",
            name: "Oasis",
        });
        const ironOre = facade.construct(OreBlueprint, {
            id: 20,
            biomeId: 10,
            type: "ore",
            name: "Iron Ore",
            isRadioactive: false,
        });
        const coconutTree = facade.construct(PlantBlueprint, {
            id: 30,
            biomeId: 10,
            type: "plant",
            name: "Coconut Tree",
            hasFruits: true,
        });

        const gameObjects: GameObject[] = [biome, ironOre, coconutTree];
        const expected: GameObject[] = [
            { ...biome, resources: [{ ...ironOre }, { ...coconutTree }] },
            { ...ironOre },
            { ...coconutTree },
        ];

        repository.useGameObjects().useEntities({ gameObjects });
        repository.useGameObjects().useLoadAllGameObjects();
        repository.useGameObjects().useLoadAllResources();

        // act
        const actual = await workspace.from(GameObjectBlueprint).select({ resources: true }).get();
        const actualFromCache = await workspace.from(GameObjectBlueprint).select({ resources: true }).cache(true).get();

        // assert
        expect(actual).toStrictEqual(expected);
        expect(actualFromCache).toStrictEqual(expected);
    });
});
