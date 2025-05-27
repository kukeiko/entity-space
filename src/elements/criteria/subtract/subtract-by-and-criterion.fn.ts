import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { invertCriterion } from "../invert/invert-criterion.fn";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractByAndCriterion(andCriterion: AndCriterion, what: Criterion): boolean | Criterion {
    const items = andCriterion
        .getCriteria()
        .map(criterion => ({ criterion, result: subtractCriterion(what, criterion) }));

    if (items.every(x => x.result === false)) {
        return false;
    } else if (items.every(x => x.result === true)) {
        return true;
    }

    // we want items that did an actual subtraction to be put first
    items.sort((a, b) => {
        if (a.result !== false && b.result === false) {
            return -1;
        } else if (a.result === false && b.result !== false) {
            return 1;
        } else {
            return 0;
        }
    });

    const subtracted: Criterion[][] = [];
    const accumulated: Criterion[] = [];

    for (const item of items) {
        if (item.result === true) {
            continue;
        }

        const subtractedCriterion = item.result === false ? invertCriterion(item.criterion) : item.result;
        subtracted.push([...accumulated, subtractedCriterion]);
        accumulated.push(item.criterion);
    }

    if (subtracted.length === 0) {
        return true;
    }

    return new OrCriterion(
        subtracted.map(criteria => (criteria.length === 1 ? criteria[0] : new AndCriterion(criteria))),
    );
}
