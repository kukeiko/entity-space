import { Criterion, fromDeepBag, inSet, NamedCriteriaBag, or } from "../criteria/public";
import { IndexValue } from "./entity-store-index";

export function createCriteriaForIndex(indexKeyPath: string[], indexValues: IndexValue[]): Criterion {
    const criteria: Criterion[] = [];

    // [todo] created criteria need to be merged to prevent creating too many queries unnecessarily.
    for (let indexValue of indexValues) {
        if (!Array.isArray(indexValue)) {
            indexValue = [indexValue];
        }

        const namedCriteriaBag: Record<string, any> = {};

        for (let i = 0; i < indexKeyPath.length; ++i) {
            const indexSingleKeyPath = indexKeyPath[i];
            const parts = indexSingleKeyPath.split(".");

            let bag = namedCriteriaBag;

            for (let e = 0; e < parts.length; ++e) {
                const part = parts[e];

                if (e < parts.length - 1) {
                    if (bag[part] === void 0) {
                        bag[part] = {} as NamedCriteriaBag;
                    }

                    bag = bag[part];
                } else {
                    bag[part] = inSet([indexValue[i] as number]);
                }
            }
        }

        const criterion = fromDeepBag(namedCriteriaBag);
        criteria.push(criterion);
    }

    return or(criteria);
}
