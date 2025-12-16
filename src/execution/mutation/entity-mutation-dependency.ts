import { Entity, EntitySchema } from "@entity-space/elements";
import { Path, readPath, toPath, toPathSegments } from "@entity-space/utils";
import { EntityMutationType } from "./entity-mutation";

export class EntityMutationDependency {
    constructor(
        type: EntityMutationType,
        schema: EntitySchema,
        entities: readonly Entity[],
        isOutbound: boolean,
        path: Path,
    ) {
        this.#type = type;
        this.#schema = schema;
        this.#entities = Object.freeze(entities.slice());
        this.#isOutbound = isOutbound;
        this.#path = path;
    }

    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #entities: readonly Entity[];
    readonly #isOutbound: boolean;
    readonly #path: Path;

    getType(): EntityMutationType {
        return this.#type;
    }

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getPath(): Path {
        return this.#path;
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }

    isOutbound(): boolean {
        return this.#isOutbound;
    }

    isInbound(): boolean {
        return !this.#isOutbound;
    }

    writeIds(schema: EntitySchema, entities: readonly Entity[]): void {
        const path = this.#path;
        const relation = schema.getRelation(path);

        let fromSchema: EntitySchema;
        let fromEntities: Entity[];

        if (toPathSegments(path).length === 1) {
            fromEntities = entities.slice();
            fromSchema = schema;
        } else {
            const pathToSchema = toPath(path.split(".").slice(0, -1).join("."));
            fromSchema = schema.getRelation(pathToSchema).getRelatedSchema();
            fromEntities = readPath(pathToSchema, entities);
        }

        relation.writeJoins(fromEntities);
    }
}
