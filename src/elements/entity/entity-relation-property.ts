import { isNotNullsy, Path } from "@entity-space/utils";
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
    joinTo: readonly Path[];
    joinToIsContainer: boolean;
}

export class EntityRelationProperty extends EntityProperty {
    constructor(
        name: string,
        schema: EntitySchema,
        options?: Partial<EntityPropertyOptions & EntityRelationPropertyOptions>,
    ) {
        super(name, options);
        this.#schema = schema;

        if (options?.relationshipType) {
            assertValidRelationshipType(options?.relationshipType);
        }

        let joinFrom = options?.joinFrom ?? [];
        let joinTo = options?.joinTo ?? [];

        if (options?.relationshipType === RelationshipType.Joined) {
            if (!schema.hasId()) {
                throw new Error(
                    `related schema ${schema.getName()} must have an id when using the Joined relationship type`,
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
            joinTo: Object.freeze(joinTo.slice()),
            joinToIsContainer: options?.joinToIsContainer === true,
        });
    }

    readonly #schema: EntitySchema;
    readonly #options: Readonly<EntityRelationPropertyOptions>;

    getRelatedSchema(): EntitySchema {
        return this.#schema;
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

    getJoinTo(): readonly Path[] {
        return this.#options.joinTo;
    }

    joinToIsContainer(): boolean {
        return this.#options.joinToIsContainer;
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
}
