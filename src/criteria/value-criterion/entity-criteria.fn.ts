import { EntityCriteria } from "./entity-criteria";
import { EntityCriterion, PropertyCriteriaBag } from "./entity-criterion";
import { ValueCriterion } from "./value-criterion";
import { valueCriteria } from "./value-criteria.fn";

type PropertyCriteriaBagConstruction<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriterion<T[K]> | ValueCriterion<T[K]>[]
        : PropertyCriteriaBagConstruction<T[K]> | PropertyCriteriaBagConstruction<T[K]>[];
};

export function entityCriteria<T>(criteria_: PropertyCriteriaBagConstruction<T> | PropertyCriteriaBagConstruction<T>[]): EntityCriteria<T> {
    const boxedCriteria = Array.isArray(criteria_) ? criteria_ : [criteria_];
    const objectCriterions: PropertyCriteriaBag<T>[] = [];

    for (const bag of boxedCriteria) {
        const objectCriterion: any = {};

        for (const property in bag) {
            const boxedCriterion = Array.isArray(bag[property]) ? bag[property] : ([bag[property]] as any);

            if (boxedCriterion[0] instanceof ValueCriterion) {
                objectCriterion[property] = valueCriteria(boxedCriterion);
            } else {
                objectCriterion[property] = entityCriteria(boxedCriterion);
            }
        }

        objectCriterions.push(objectCriterion);
    }

    return new EntityCriteria<T>(objectCriterions.map(criterion => new EntityCriterion(criterion)));
}
