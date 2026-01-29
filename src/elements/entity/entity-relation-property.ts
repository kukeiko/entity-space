import { isNotNullsy, isNullsy, Path, readPath, writePath } from "@entity-space/utils";
import { isPlainObject } from "lodash";
import { Entity } from "./entity";
import { EntityPrimitiveProperty } from "./entity-primitive-property";
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
    outbound?: boolean;
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
            outbound: options?.outbound,
        });
    }

    readonly #relatedSchema: EntitySchema;
    readonly #options: Readonly<EntityRelationPropertyOptions>;

    override isPrimitive(): this is EntityPrimitiveProperty {
        return false;
    }

    override isRelation(): this is EntityRelationProperty {
        return true;
    }

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

    isOutbound(): boolean {
        if (this.#options.outbound !== undefined) {
            return this.#options.outbound === true;
        } else if (!this.isJoined()) {
            throw new Error(`relation ${this.getNameWithSchema()} is not a joined relation`);
        } else if (this.joinsToId() && this.joinsFromId()) {
            const lastJoinFrom = this.getJoinFrom().at(-1)!;
            const lastJoinTo = this.getJoinTo().at(-1)!;
            const isLastJoinFromCreatable = this.getSchema().getPrimitive(lastJoinFrom.valueOf()).isCreatable();
            const isLastJoinToCreatable = this.getRelatedSchema().getPrimitive(lastJoinTo.valueOf()).isCreatable();

            if (isLastJoinFromCreatable && isLastJoinToCreatable) {
                throw new Error(`could not determine if relation ${this.getNameWithSchema()} is outbound`);
            } else if (isLastJoinFromCreatable) {
                return true;
            } else if (isLastJoinToCreatable) {
                return false;
            } else {
                throw new Error(`could not determine if relation ${this.getNameWithSchema()} is outbound`);
            }
        } else if (this.joinsToId()) {
            return true;
        } else if (this.joinsFromId()) {
            return false;
        } else {
            throw new Error(`could not determine if relation ${this.getNameWithSchema()} is outbound`);
        }
    }

    isInbound(): boolean {
        return !this.isOutbound();
    }

    override readValue<T extends Entity | Entity[] | undefined | null>(entity: Entity): T {
        const name = this.getName();
        const value = entity[name];

        if (isNullsy(value)) {
            return value;
        } else if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error(`expected property ${name} to be an array, got ${typeof value}`);
            }

            return value;
        } else {
            if (!isPlainObject(value)) {
                throw new Error(`expected property ${name} to be an object, got ${typeof value}`);
            }

            return value;
        }
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

    readValuesFlat(entities: readonly Entity[]): Entity[] {
        return entities
            .map(entity => this.readValue(entity))
            .filter(isNotNullsy)
            .flat();
    }

    writeJoins(entities: readonly Entity[]): void {
        const [joinsFrom, joinsTo] = [this.getJoinFrom(), this.getJoinTo()];

        for (const entity of entities) {
            for (const related of this.readValueAsArray(entity)) {
                for (let i = 0; i < joinsFrom.length; i++) {
                    let [joinFrom, joinTo] = [joinsFrom[i], joinsTo[i]];

                    if (this.isOutbound()) {
                        writePath(joinFrom, entity, readPath(joinTo, related) ?? 0);
                    } else {
                        writePath(joinTo, related, readPath(joinFrom, entity) ?? 0);
                    }
                }
            }
        }
    }
}
