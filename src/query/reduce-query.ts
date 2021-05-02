import { Query } from "./query";
import { reduceObjectCriteria } from "../criteria";
import { reduceSelection } from "../selection";

// [todo] options reduction missing
export function reduceQuery(a: Query, b: Query): Query | null {
    const reducedCriteria = reduceObjectCriteria(a.criteria, b.criteria);

    if (reducedCriteria === a.criteria) {
        return a;
    } else if (reducedCriteria === null) {
        const reducedSelection = reduceSelection(a.selection, b.selection);

        if (reducedSelection === null) {
            return null;
        }

        return {
            criteria: a.criteria,
            model: a.model,
            options: a.options,
            selection: reducedSelection,
        };
    } else {
        return {
            criteria: reducedCriteria,
            model: a.model,
            options: a.options,
            selection: a.selection,
        };
    }
}
