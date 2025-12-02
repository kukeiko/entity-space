import { isNotNullsy, Path, readPath, writePath } from "@entity-space/utils";
import { isNull, isPlainObject, isUndefined } from "lodash";
import { Entity } from "./entity";
import { EntityProperty, EntityPropertyOptions } from "./entity-property";
import { EntitySchema } from "./entity-schema";

export enum RelationshipType {
    Joined = "joined",
}

function assertValidRelationshipType(relationshipType: RelationshipType): void {
    if (!Object.values(RelationshipType).some(value => value === relationshipType)) {
        throw new Error(`${relationshipType} is not a valid RelationshipType`);
    }
}

export function isEntityRelationProperty(value: unknown): value is EntityRelationProperty {
    return value instanceof EntityRelationProperty;
}

export interface EntityRelationPropertyOptions {
    relationshipType?: RelationshipType;
    joinFrom: readonly Path[];
    joinFromIsContainer: boolean;
    joinsFromId: boolean;
    joinTo: readonly Path[];
    joinToIsContainer: boolean;
    joinsToId: boolean;
    parent: boolean;
}

export class EntityRelationProperty extends EntityProperty {
    constructor(
        name: string,
        schema: EntitySchema,
        relatedSchema: EntitySchema,
        options?: Partial<EntityPropertyOptions & EntityRelationPropertyOptions>,
    ) {
        super(name, schema, options);
        this.#relatedSchema = relatedSchema;

        if (options?.relationshipType) {
            assertValidRelationshipType(options?.relationshipType);
        }

        let joinFrom = options?.joinFrom ?? [];
        let joinTo = options?.joinTo ?? [];

        if (options?.relationshipType === RelationshipType.Joined) {
            if (!relatedSchema.hasId()) {
                throw new Error(
                    `related schema ${relatedSchema.getName()} must have an id when using the Joined relationship type`,
                );
            }

            if (!joinFrom.length) {
                throw new Error(`joinFrom can't be empty when using the Joined relationship type`);
            }

            if (!joinTo.length) {
                throw new Error(`joinTo can't be empty when using the Joined relationship type`);
            }

            if (joinFrom.length !== joinTo.length) {
                throw new Error(`joinFrom & joinTo must have the same length`);
            }
        } else {
            if (joinFrom.length) {
                throw new Error(`joinFrom must be empty when using a relationship type other than Joined`);
            }

            if (joinTo.length) {
                throw new Error(`joinTo must be empty when using a relationship type other than Joined`);
            }
        }

        this.#options = Object.freeze<EntityRelationPropertyOptions>({
            relationshipType: options?.relationshipType,
            joinFrom: Object.freeze(joinFrom.slice()),
            joinFromIsContainer: options?.joinFromIsContainer === true,
            joinsFromId: options?.joinsFromId === true,
            joinTo: Object.freeze(joinTo.slice()),
            joinToIsContainer: options?.joinToIsContainer === true,
            joinsToId: options?.joinsToId === true,
            parent: options?.parent === true,
        });
    }

    readonly #relatedSchema: EntitySchema;
    readonly #options: Readonly<EntityRelationPropertyOptions>;

    getRelatedSchema(): EntitySchema {
        return this.#relatedSchema;
    }

    isEmbedded(): boolean {
        return this.#options.relationshipType === undefined;
    }

    isJoined(): boolean {
        return this.#options.relationshipType === RelationshipType.Joined;
    }

    getJoinFrom(): readonly Path[] {
        return this.#options.joinFrom;
    }

    joinFromIsContainer(): boolean {
        return this.#options.joinFromIsContainer;
    }

    joinsFromId(): boolean {
        return this.#options.joinsFromId;
    }

    getJoinTo(): readonly Path[] {
        return this.#options.joinTo;
    }

    joinToIsContainer(): boolean {
        return this.#options.joinToIsContainer;
    }

    joinsToId(): boolean {
        return this.#options.joinsToId;
    }

    isParent(): boolean {
        return this.#options.parent;
    }

    readValue(entity: Entity): Entity | Entity[] | undefined | null {
        const name = this.getName();
        const value = entity[name];

        if (isNull(value) || isUndefined(value)) {
            return value;
        } else if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error(`expected property ${name} to be an array, got ${typeof value}`);
            }

            return value as Entity[];
        } else {
            if (!isPlainObject(value)) {
                throw new Error(`expected property ${name} to be an object, got ${typeof value}`);
            }

            return value as Entity;
        }
    }

    readValues(entities: readonly Entity[]): Entity[] {
        return entities
            .map(entity => this.readValue(entity))
            .filter(isNotNullsy)
            .flat();
    }

    readValueAsArray(entity: Entity): Entity[] {
        const value = this.readValue(entity);

        if (value == null) {
            return [];
        } else if (!Array.isArray(value)) {
            return [value];
        } else {
            return value;
        }
    }

    // [todo] ❌ implement remaining
    // [todo] ❌ move to standalone file
    writeIds(entities: readonly Entity[]): void {
        if (this.joinsFromId() && this.joinsToId()) {
            if (!this.isArray() && !this.joinToIsContainer()) {
                const [joinsFrom, joinsTo] = [this.getJoinFrom(), this.getJoinTo()];

                for (const entity of entities) {
                    const related = this.readValue(entity) as Entity | null | undefined;

                    if (related == null) {
                        continue;
                    }

                    for (let i = 0; i < joinsFrom.length; i++) {
                        let [joinFrom, joinTo] = [joinsFrom[i], joinsTo[i]];

                        if (this.isParent()) {
                            [joinTo, joinFrom] = [joinFrom, joinTo];
                        }

                        writePath(joinFrom, entity, readPath(joinTo, related) ?? 0);
                    }
                }
            } else {
                throw new Error("not supported: joins both from & to id");
            }
        } else if (this.joinsFromId()) {
            if (this.isArray() && this.joinToIsContainer()) {
                // [todo] implement
                throw new Error("not yet implemented");
            } else if (this.isArray()) {
                const [joinsFrom, joinsTo] = [this.getJoinFrom(), this.getJoinTo()];

                for (const entity of entities) {
                    const related = this.readValueAsArray(entity);

                    if (!related.length) {
                        continue;
                    }

                    for (const relatedEntity of related) {
                        for (let i = 0; i < joinsFrom.length - 1; i++) {
                            const [joinFrom, joinTo] = [joinsFrom[i], joinsTo[i]];
                            writePath(joinTo, relatedEntity, readPath(joinFrom, entity));
                        }

                        const [lastJoinFrom, lastJoinTo] = [joinsFrom.at(-1)!, joinsTo.at(-1)!];
                        writePath(lastJoinTo, relatedEntity, readPath(lastJoinFrom, entity) ?? 0);
                    }
                }
            } else {
                // [todo] implement
                throw new Error("not yet implemented");
            }
        } else if (this.joinsToId()) {
            if (this.isArray() && this.joinFromIsContainer()) {
                const [joinsFrom, joinsTo] = [this.getJoinFrom(), this.getJoinTo()];

                for (const entity of entities) {
                    const related = this.readValueAsArray(entity);

                    if (!related.length) {
                        continue;
                    }

                    for (let i = 0; i < joinsFrom.length - 1; i++) {
                        const [joinFrom, joinTo] = [joinsFrom[i], joinsTo[i]];
                        // [todo] instead we should collect all values from related and write once, and assert that they are all the same
                        writePath(joinFrom, entity, readPath(joinTo, related[0]));
                    }

                    const [lastJoinFrom, lastJoinTo] = [joinsFrom.at(-1)!, joinsTo.at(-1)!];
                    writePath(lastJoinFrom, entity, readPath(lastJoinTo, related) ?? 0);
                }
            } else if (this.isArray()) {
                // [todo] implement
                throw new Error("not yet implemented");
            } else {
                const [joinsFrom, joinsTo] = [this.getJoinFrom(), this.getJoinTo()];

                for (const entity of entities) {
                    const related = this.readValue(entity) as Entity | null | undefined;

                    if (related == null) {
                        continue;
                    }

                    for (let i = 0; i < joinsFrom.length; i++) {
                        const [joinFrom, joinTo] = [joinsFrom[i], joinsTo[i]];
                        writePath(joinFrom, entity, readPath(joinTo, related) ?? 0);
                    }
                }
            }
        } else {
            throw new Error("relation doesn't join on any id");
        }
    }
}
