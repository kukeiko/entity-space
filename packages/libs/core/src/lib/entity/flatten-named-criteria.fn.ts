import { InSetCriterion, NamedCriteria } from "../criteria/public";

function flattenNamedCriteriaInternal(
    criterion: NamedCriteria,
    bagWithPrimitives: Record<string, any>,
    path: string[]
): void {
    const bag = criterion.getBag();
    for (const property in bag) {
        const criterionInBag = bag[property] as any;
        const propertyFullPath = [...path, property].join(".");

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
