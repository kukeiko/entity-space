import { EntityBlueprint } from "@entity-space/elements";
import {
    FactionBlueprint,
    GameObject,
    GameObjectBlueprint,
    ResourceBlueprint,
    Scene,
    SceneBlueprint,
} from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { InMemoryRepository } from "./in-memory-repository";

type GameObjectEntities = {
    scenes: Scene[];
    gameObjects: GameObject[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class GameObjectRepository extends InMemoryRepository<GameObjectEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadSceneById() {
        const load = vi.fn((id: number) => this.filter("scenes", filterById(id)));

        this.#services.for(SceneBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.$equals),
        });

        return load;
    }

    useLoadAllGameObjects(selection?: { factions?: boolean }) {
        const load = vi.fn(() => {
            const gameObjects = this.filter("gameObjects");

            if (selection?.factions) {
                const factions = this.#filterUnion(["faction"]);

                for (const character of gameObjects.filter(entity => entity.type === "character")) {
                    const faction = factions.find(faction => faction.id === character.factionId);

                    if (faction) {
                        character.faction = faction;
                    }
                }
            }

            return gameObjects;
        });

        if (selection?.factions) {
            this.#services
                .for(GameObjectBlueprint)
                .addSource({ load, select: { faction: (selection?.factions === true) as true } });
        } else {
            this.#services.for(GameObjectBlueprint).addSource({ load });
        }

        return load;
    }

    useLoadAllFactions() {
        const load = vi.fn(() => this.#filterUnion(["faction"]));
        this.#services.for(FactionBlueprint).addSource({ load });

        return load;
    }

    useLoadAllResources() {
        const load = vi.fn(() => this.#filterUnion(["plant", "ore"]));
        this.#services.for(ResourceBlueprint).addSource({ load });

        return load;
    }

    useCreateScene() {
        const create = vi.fn<CreateEntityFn<SceneBlueprint>>(({ entity }) => {
            const nextId = this.nextId("scenes");

            const created: EntityBlueprint.Type<SceneBlueprint> = {
                ...entity,
                id: nextId,
            };

            this.entities.scenes = [...(this.entities.scenes ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(SceneBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useCreateGameObject() {
        const create = vi.fn<CreateEntityFn<GameObjectBlueprint>>(({ entity }) => {
            const nextId = this.nextId("gameObjects");

            const created: EntityBlueprint.Type<GameObjectBlueprint> = {
                ...entity,
                id: nextId,
            };

            this.entities.gameObjects = [...(this.entities.gameObjects ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(GameObjectBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useCreateFaction() {
        const create = vi.fn<CreateEntityFn<FactionBlueprint>>(({ entity }) => {
            const nextId = this.nextId("gameObjects");

            const created: EntityBlueprint.Type<FactionBlueprint> = {
                ...entity,
                id: nextId,
            };

            this.entities.gameObjects = [...(this.entities.gameObjects ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(FactionBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useCreateResource() {
        const create = vi.fn<CreateEntityFn<ResourceBlueprint>>(({ entity }) => {
            const nextId = this.nextId("gameObjects");

            const created: EntityBlueprint.Type<ResourceBlueprint> = {
                ...entity,
                id: nextId,
            };

            this.entities.gameObjects = [...(this.entities.gameObjects ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(ResourceBlueprint).addCreateOneMutator({ create });

        return create;
    }

    #filterUnion<T extends GameObject["type"]>(
        types: T[],
        predicate?: (entity: Extract<GameObject, { type: T }>) => boolean,
    ): Extract<GameObject, { type: T }>[] {
        return (this.entities.gameObjects ?? [])
            .filter((entity): entity is Extract<GameObject, { type: T }> => types.includes(entity.type as T))
            .filter(entity => (predicate ? predicate(entity) : true));
    }
}
