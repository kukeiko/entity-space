import { Path } from "@entity-space/utils";
import { Entity } from "./entity";

export enum EntitySortDirection {
    Ascending = "asc",
    Descending = "desc",
}

export type EntitySortFn = (entities: readonly Entity[]) => readonly Entity[];

export class EntityPropertySort {
    constructor(path: Path, mode = EntitySortDirection.Ascending, sortFn?: EntitySortFn) {
        this.#path = path;
        this.#mode = mode;
        this.#sortFn = sortFn;
    }

    readonly #path: Path;
    readonly #mode: EntitySortDirection;
    readonly #sortFn?: EntitySortFn;

    getPath(): Path {
        return this.#path;
    }

    getMode(): EntitySortDirection {
        return this.#mode;
    }

    isAscending(): boolean {
        return this.#mode === EntitySortDirection.Ascending;
    }

    equals(other: EntityPropertySort): boolean {
        if (this.#sortFn !== undefined || other.#sortFn !== undefined) {
            return false;
        } else if (this.#mode !== other.#mode) {
            return false;
        } else if (this.#path.toString() !== other.#path.toString()) {
            return false;
        } else {
            return true;
        }
    }
}

export class EntitySort {
    constructor(properties: readonly EntityPropertySort[]) {
        this.#properties = Object.freeze(properties.slice());
    }

    readonly #properties: readonly EntityPropertySort[];

    getProperties(): readonly EntityPropertySort[] {
        return this.#properties;
    }

    getPropertyPaths(): readonly Path[] {
        return this.#properties.map(property => property.getPath());
    }

    equals(other: EntitySort): boolean {
        if (this.#properties.length !== other.#properties.length) {
            return false;
        }

        return this.#properties.every((property, index) => property.equals(other.#properties[index]));
    }

    toString(): string {
        const parts: string[] = [];

        for (const property of this.getProperties()) {
            if (property.isAscending()) {
                parts.push(property.getPath().toString());
            } else {
                parts.push(`!${property.getPath().toString()}`);
            }
        }

        return `${parts.join(", ")}`;
    }
}
