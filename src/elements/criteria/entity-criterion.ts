import { isPrimitive, Primitive, Unbox } from "@entity-space/utils";
import { isPlainObject } from "lodash";
import { Entity, isEntity } from "../entity/entity";
import { Criterion } from "./criterion";
import { EqualsCriterion } from "./equals-criterion";
import { InArrayCriterion } from "./in-array-criterion";

export type PackedEntityCriterion<T extends Entity = Entity> = {
    [K in keyof T]?: PackedEntityCriterion<Unbox<T[K]>> | ReturnType<Primitive> | ReturnType<Primitive>[] | Criterion;
};

export class EntityCriterion extends Criterion {
    constructor(criteria: PackedEntityCriterion) {
        super();
        const unpacked: Record<string, Criterion> = {};

        for (const key in criteria) {
            const value = criteria[key];

            if (isPrimitive(value)) {
                unpacked[key] = new EqualsCriterion(value);
            } else if (Array.isArray(value) && value.every(isPrimitive)) {
                unpacked[key] = new InArrayCriterion(value);
            } else if (isPlainObject(value)) {
                unpacked[key] = new EntityCriterion(value as PackedEntityCriterion);
            } else if (value instanceof Criterion) {
                unpacked[key] = value;
            }
        }

        this.#criteria = Object.freeze({ ...unpacked });
    }

    override readonly type = "entity";
    readonly #criteria: Readonly<Record<string, Criterion>>;

    getCriteria(): Readonly<Record<string, Criterion>> {
        return this.#criteria;
    }

    getType(): "entity" {
        return "entity";
    }

    override contains(value: unknown): boolean {
        if (!isEntity(value)) {
            return false;
        }

        return Object.entries(this.#criteria).every(([key, criterion]) => criterion.contains(value[key]));
    }

    override toString(): string {
        return `{ ${Object.entries(this.#criteria)
            .map(([key, criterion]) => `${key}: ${criterion.toString()}`)
            .join(", ")} }`;
    }
}
