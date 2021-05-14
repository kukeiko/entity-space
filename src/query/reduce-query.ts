import { Query } from "./query";
import { reduceObjectCriteria } from "../criteria";
import { reduceSelection } from "../selection";

// [todo] options reduction missing
export function reduceQuery(a: Query, b: Query): Query[] {
    const reducedCriteria = reduceObjectCriteria(a.criteria, b.criteria);
    const reducedSelection = reduceSelection(a.selection, b.selection);

    if (reducedCriteria === a.criteria) {
        return [a];
    } else if (reducedCriteria === null) {
        if (reducedSelection === null) {
            return [];
        }

        return [
            {
                criteria: a.criteria,
                model: a.model,
                options: a.options,
                selection: reducedSelection,
            },
        ];
    } else if (reducedSelection === null) {
        return [
            {
                criteria: reducedCriteria,
                model: a.model,
                options: a.options,
                selection: a.selection,
            },
        ];
    } else if (a.selection !== reducedSelection) {
        return [
            {
                criteria: reducedCriteria,
                model: a.model,
                options: a.options,
                selection: a.selection,
            },
            {
                criteria: b.criteria,
                model: b.model,
                options: b.options,
                selection: reducedSelection,
            },
        ];
    } else {
        return [a];
    }
}
