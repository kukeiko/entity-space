import { Criteria } from "./object-criteria";
import { ObjectCriterion, PropertyCriteriaBag } from "./object-criterion";
import { ValueCriterion } from "./value-criterion";
import { valueMatches } from "./value-matches";

type PropertyCriteriaBagConstruction<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriterion<T[K]> | ValueCriterion<T[K]>[]
        : PropertyCriteriaBagConstruction<T[K]> | PropertyCriteriaBagConstruction<T[K]>[];
};

export function criteria<T>(criteria_: PropertyCriteriaBagConstruction<T> | PropertyCriteriaBagConstruction<T>[]): Criteria<T> {
    const boxedCriteria = Array.isArray(criteria_) ? criteria_ : [criteria_];
    const objectCriterions: PropertyCriteriaBag<T>[] = [];

    for (const bag of boxedCriteria) {
        const objectCriterion: any = {};

        for (const property in bag) {
            const boxedCriterion = Array.isArray(bag[property]) ? bag[property] : ([bag[property]] as any);

            if (boxedCriterion[0] instanceof ValueCriterion) {
                objectCriterion[property] = valueMatches(boxedCriterion);
            } else {
                objectCriterion[property] = criteria(boxedCriterion);
            }
        }

        objectCriterions.push(objectCriterion);
    }

    return new Criteria<T>(objectCriterions.map(criterion => new ObjectCriterion(criterion)));
}
