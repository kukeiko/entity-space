import { EntityCriterion, PropertyCriteriaBag } from "./entity-criterion";
import { or } from "./or.fn";
import { ValueCriterion } from "./value-criterion";

type PropertyCriteriaBagConstruction<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriterion<T[K]> | ValueCriterion<T[K]>[]
        : PropertyCriteriaBagConstruction<T[K]> | PropertyCriteriaBagConstruction<T[K]>[];
};

export class EntityCriteria<T = unknown> extends ValueCriterion<T> {
    constructor(items: EntityCriterion<T>[]) {
        super();
        this.items = items;
    }

    readonly items: EntityCriterion<T>[];

    getItems(): EntityCriterion<T>[] {
        return this.items;
    }

    reduce(other: ValueCriterion): boolean | EntityCriteria<T> {
        if (!(other instanceof EntityCriteria)) return false;

        if (this.items.length === 0 && other.items.length === 0) {
            return new EntityCriteria<T>([]);
        }

        let reduced = other.items.slice();
        let didReduceAny = false;

        // for each criterion in B, pick each criterion in A and try to reduce it.
        // criteria in A are updated with the reduced results as we go.
        for (const criterionB of this.items) {
            const nextReduced: EntityCriterion<T>[] = [];

            for (const criterionA of reduced) {
                const reducedCriteria = criterionB.reduce(criterionA);

                if (reducedCriteria && !(reducedCriteria instanceof EntityCriteria)) {
                    throw new Error("temp error until entity-criteria is redone");
                }

                if (reducedCriteria) {
                    nextReduced.push(...reducedCriteria.items);
                    didReduceAny = true;
                } else {
                    nextReduced.push(criterionA);
                }
            }

            reduced = nextReduced;
        }

        return didReduceAny ? new EntityCriteria(reduced) : false;
    }

    invert(): ValueCriterion<T> {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        if (this.items.length === 1) {
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }

    // invert(): ValueCriteria<T> {
    //     const inverted: ValueCriterion<T>[] = [];

    //     for (const criterion of this.items) {
    //         inverted.push(...criterion.invert());
    //     }

    //     return new ValueCriteria(this.valueType, inverted);
    // }

    static create<T>(criteria_: PropertyCriteriaBagConstruction<T> | PropertyCriteriaBagConstruction<T>[]): EntityCriteria<T> {
        const boxedCriteria = Array.isArray(criteria_) ? criteria_ : [criteria_];
        const objectCriterions: PropertyCriteriaBag<T>[] = [];

        for (const bag of boxedCriteria) {
            const objectCriterion: any = {};

            for (const property in bag) {
                const boxedCriterion = Array.isArray(bag[property]) ? bag[property] : ([bag[property]] as any);

                if (boxedCriterion[0] instanceof ValueCriterion) {
                    objectCriterion[property] = or(boxedCriterion);
                } else {
                    objectCriterion[property] = EntityCriteria.create(boxedCriterion);
                }
            }

            objectCriterions.push(objectCriterion);
        }

        return new EntityCriteria<T>(objectCriterions.map(criterion => new EntityCriterion(criterion)));
    }
}
