import { Path } from "@entity-space/utils";

export class EntitySortShape {
    constructor(sortableProperties: readonly Path[]) {
        this.#sortableProperties = Object.freeze(sortableProperties.slice());
    }

    readonly #sortableProperties: readonly Path[];

    getSortableProperties(): readonly Path[] {
        return this.#sortableProperties;
    }

    includesSortableProperties(properties: readonly Path[]): boolean {
        return properties.every(property =>
            this.#sortableProperties.find(candidate => candidate.toString() === property.toString()),
        );
    }
}
