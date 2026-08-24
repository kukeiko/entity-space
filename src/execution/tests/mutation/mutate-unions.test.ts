import {
    BiomeBlueprint,
    CharacterBlueprint,
    FactionBlueprint,
    GameObject,
    GameObjectBlueprint,
    OreBlueprint,
    PlantBlueprint,
    SceneBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("mutate unions", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("save() can create union entities", async () => {
        // arrange
        const scene = facade.construct(SceneBlueprint, { name: "World" });
        const character = facade.construct(CharacterBlueprint, {
            name: "Susi",
            faction: facade.construct(FactionBlueprint, { name: "Empire", scene }),
            scene,
        });
        const biome = facade.construct(BiomeBlueprint, {
            name: "Dunes",
            scene,
            resources: [
                facade.construct(PlantBlueprint, { name: "Coconut Tree", hasFruits: true, scene }),
                facade.construct(OreBlueprint, { name: "Iron Ore", isRadioactive: false, scene }),
            ],
        });

        const gameObjects: GameObject[] = [character, biome];
        const createScene = repository.useGameObjects().useCreateScene();
        const createGameObject = repository.useGameObjects().useCreateGameObject();
        const createFaction = repository.useGameObjects().useCreateFaction();
        const createResource = repository.useGameObjects().useCreateResource();

        // act
        const saved = await workspace
            .in(GameObjectBlueprint)
            .select({ faction: { scene: true }, resources: { scene: true }, scene: true })
            .save(gameObjects);

        // assert
        expect(createFaction).toHaveBeenCalledBefore(createGameObject);
        expect(createResource).toHaveBeenCalledAfter(createGameObject);
        expect(createScene).toHaveBeenCalledBefore(createGameObject);

        expect(saved).toStrictEqual([
            {
                id: 2,
                name: "Susi",
                sceneId: 1,
                scene: { id: 1, name: "World" },
                type: "character",
                factionId: 1,
                faction: { id: 1, name: "Empire", sceneId: 1, type: "faction", scene: { id: 1, name: "World" } },
            },
            {
                id: 3,
                name: "Dunes",
                sceneId: 1,
                type: "biome",
                scene: { id: 1, name: "World" },
                resources: [
                    {
                        id: 4,
                        name: "Coconut Tree",
                        sceneId: 1,
                        biomeId: 3,
                        type: "plant",
                        hasFruits: true,
                        scene: { id: 1, name: "World" },
                    },
                    {
                        id: 5,
                        name: "Iron Ore",
                        sceneId: 1,
                        biomeId: 3,
                        type: "ore",
                        isRadioactive: false,
                        scene: { id: 1, name: "World" },
                    },
                ],
            },
        ] satisfies GameObject[]);
    });
});
