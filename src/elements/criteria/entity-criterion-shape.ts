import { Class, isPrimitiveType, Primitive, Unbox } from "@entity-space/utils";
import { intersection, isPlainObject } from "lodash";
import { Entity } from "../entity/entity";
import { CriterionShape } from "./criterion-shape";
import { EntityCriterion } from "./entity-criterion";
import { EqualsCriterionShape } from "./equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array-criterion-shape";

export type PackedEntityCriterionShape<T extends Entity = Entity> = {
    [K in keyof T]?:
        | PackedEntityCriterionShape<Unbox<T[K]>> // EntityCriterionShape (required only)
        | [PackedEntityCriterionShape<Unbox<T[K]>>, PackedEntityCriterionShape<Unbox<T[K]>>] // EntityCriterionShape (both required & optional)
        | Primitive // EqualsCriterionShape
        | Primitive[] // EqualsCriterionShape
        | [Primitive] // InArrayCriterionShape
        | [Primitive[]] // InArrayCriterionShape
        | CriterionShape
        | CriterionShape[];
};

function unpack(typedCriterion: PackedEntityCriterionShape): Record<string, CriterionShape[]> {
    const unpacked: Record<string, CriterionShape[]> = {};

    for (const key in typedCriterion) {
        const value = typedCriterion[key];

        if (isPrimitiveType(value)) {
            unpacked[key] = [new EqualsCriterionShape([value])];
        } else if (Array.isArray(value) && value.every(isPrimitiveType)) {
            unpacked[key] = [new EqualsCriterionShape(value)];
        } else if (
            Array.isArray(value) &&
            value.length === 1 &&
            Array.isArray(value[0]) &&
            value[0].every(isPrimitiveType)
        ) {
            unpacked[key] = [new InArrayCriterionShape(value[0])];
        } else if (isPlainObject(value)) {
            unpacked[key] = [new EntityCriterionShape(unpack(value as PackedEntityCriterionShape))];
        } else if (Array.isArray(value) && value.length === 2 && value.every(isPlainObject)) {
            unpacked[key] = [
                new EntityCriterionShape(
                    unpack(value[0] as PackedEntityCriterionShape),
                    unpack(value[1] as PackedEntityCriterionShape),
                ),
            ];
        } else if (value instanceof CriterionShape) {
            unpacked[key] = [value];
        } else if (Array.isArray(value) && value.every(item => item instanceof CriterionShape)) {
            unpacked[key] = value;
        }
    }

    return unpacked;
}

export class EntityCriterionShape extends CriterionShape<EntityCriterion> {
    constructor(required: PackedEntityCriterionShape, optional?: PackedEntityCriterionShape) {
        super();

        this.#required = Object.freeze(unpack(required));
        this.#optional = optional ? Object.freeze(unpack(optional)) : undefined;

        if (this.#optional && intersection(Object.keys(this.#required), Object.keys(this.#optional)).length) {
            throw new Error("required & optional shapes must not share keys");
        }
    }

    readonly #required: Readonly<Record<string, CriterionShape[]>>;
    readonly #optional?: Readonly<Record<string, CriterionShape[]>>;
    override readonly type = "entity";

    getRequiredShapes(): Readonly<Record<string, CriterionShape[]>> {
        return this.#required;
    }

    getOptionalShapes(): Readonly<Record<string, CriterionShape[]>> | undefined {
        return this.#optional;
    }

    isOptional(): boolean {
        return Object.keys(this.#required).length === 0;
    }

    override getCriterionType(): Class<EntityCriterion> {
        return EntityCriterion;
    }

    override toString(): string {
        return `{ ${[
            ...Object.entries(this.#required).map(([key, value]) => `${key}: ${value.toString()}`),
            ...Object.entries(this.#optional ?? {}).map(([key, value]) => `${key}?: ${value.toString()}`),
        ].join(", ")} }`;
    }
}
