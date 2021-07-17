import { EntityCriteria } from "./entity-criteria";
import { EntityCriterion, PropertyCriteriaBag } from "./entity-criterion";
import { ValueCriterion } from "./value-criterion";
import { or } from "./or.fn";

type PropertyCriteriaBagConstruction<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriterion<T[K]> | ValueCriterion<T[K]>[]
        : PropertyCriteriaBagConstruction<T[K]> | PropertyCriteriaBagConstruction<T[K]>[];
};

// [todo] remove casts to "any"
// also, this function has some really dirty code
export function entityCriteria<T>(criteria_: PropertyCriteriaBagConstruction<T> | PropertyCriteriaBagConstruction<T>[]): EntityCriteria<T> {
    const boxedCriteria = Array.isArray(criteria_) ? criteria_ : [criteria_];
    const objectCriterions: PropertyCriteriaBag<T>[] = [];

    for (const bag of boxedCriteria) {
        const objectCriterion: any = {};

        for (const property in bag) {
            if (Array.isArray(bag[property])) {
                if ((bag[property] as any)[0] instanceof ValueCriterion) {
                    objectCriterion[property] = or(bag[property] as any);
                } else {
                    objectCriterion[property] = entityCriteria(bag[property] as any);
                }
            } else {
                if (bag[property] instanceof ValueCriterion) {
                    objectCriterion[property] = bag[property];
                } else {
                    objectCriterion[property] = new EntityCriterion(bag[property] as any);
                }
            }
            // const boxedCriterion = Array.isArray(bag[property]) ? bag[property] : ([bag[property]] as any);

            // if (boxedCriterion[0] instanceof ValueCriterion) {
            //     objectCriterion[property] = valueCriteria(boxedCriterion);
            // } else {
            //     objectCriterion[property] = entityCriteria(boxedCriterion);
            // }
        }

        objectCriterions.push(objectCriterion);
    }

    return new EntityCriteria<T>(objectCriterions.map(criterion => new EntityCriterion(criterion)));
}
