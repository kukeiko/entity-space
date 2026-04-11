import { EntitySelection } from "../../selection/entity-selection";
import { Entity } from "../entity";

export class EntityComputedProperties {
    constructor(hydrates: EntitySelection, requires: EntitySelection, hydrateFn: (entity: Entity) => void) {
        this.#hydrates = hydrates;
        this.#requires = requires;
        this.#hydrateFn = hydrateFn;
    }

    readonly #hydrates: EntitySelection;
    readonly #requires: EntitySelection;
    readonly #hydrateFn: (entity: Entity) => void;

    getHydratedSelection(): EntitySelection {
        return this.#hydrates;
    }

    getRequiredSelection(): EntitySelection {
        return this.#requires;
    }

    hydrate(entity: Entity): void {
        this.#hydrateFn(entity);
    }
}
