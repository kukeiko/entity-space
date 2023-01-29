import { NamedCriteria } from "../../criteria/criterion/named/named-criteria";
import { InSetCriterion } from "../../criteria/criterion/set/in-set-criterion";

// [todo] move to criteria folder :?
function flattenNamedCriteriaInternal(
    criterion: NamedCriteria,
    bagWithPrimitives: Record<string, any>,
    path: string[]
): void {
    const bag = criterion.getBag();
    for (const property in bag) {
        const criterionInBag = bag[property] as any;
        const propertyFullPath = [...path, property].join(".");

        // [todo] support more than in-set
        if (criterionInBag instanceof InSetCriterion) {
            bagWithPrimitives[propertyFullPath] = Array.from(criterionInBag.getValues());
        } else if (criterionInBag instanceof NamedCriteria) {
            flattenNamedCriteriaInternal(criterionInBag, bagWithPrimitives, [...path, property]);
        }
    }
}

export function flattenNamedCriteria(criterion: NamedCriteria) {
    const bagWithPrimitives: Record<string, any> = {};

    flattenNamedCriteriaInternal(criterion, bagWithPrimitives, []);

    return bagWithPrimitives;
}
