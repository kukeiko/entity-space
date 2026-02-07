import { Entity, EntitySchema } from "@entity-space/elements";
import { Path, readPath, toPath, toPathSegments } from "@entity-space/utils";
import { EntityMutationType } from "../entity-mutation";

export class EntityChangeDependency {
    constructor(type: EntityMutationType, schema: EntitySchema, path: Path, entity: Entity) {
        this.#type = type;
        this.#schema = schema;
        this.#path = path;
        this.#entity = entity;
    }

    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #path: Path;
    readonly #entity: Entity;

    getEntity(): Entity {
        return this.#entity;
    }

    getPath(): Path {
        return this.#path;
    }

    isOutbound(): boolean {
        if (this.#type === "delete") {
            return this.#schema.getRelation(this.#path).isInbound();
        } else {
            return this.#schema.getRelation(this.#path).isOutbound();
        }
    }

    isInbound(): boolean {
        if (this.#type === "delete") {
            return this.#schema.getRelation(this.#path).isOutbound();
        } else {
            return this.#schema.getRelation(this.#path).isInbound();
        }
    }

    writeIds(schema: EntitySchema, entities: readonly Entity[]): void {
        const path = this.#path;
        const relation = schema.getRelation(path);

        let fromEntities: Entity[];

        if (toPathSegments(path).length === 1) {
            fromEntities = entities.slice();
        } else {
            const pathToSchema = toPath(path.split(".").slice(0, -1).join("."));
            fromEntities = readPath(pathToSchema, entities);
        }

        relation.writeJoins(fromEntities);
    }
}
