import { Shape, ShapeBlueprint } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { InMemoryRepository } from "./in-memory-repository";

type ShapeEntities = {
    shapes: Shape[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class ShapeRepository extends InMemoryRepository<ShapeEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadShapeById() {
        const load = vi.fn((id: number) => this.filter("shapes", filterById(id)));

        this.#services.for(ShapeBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.$equals),
        });

        return load;
    }
}
