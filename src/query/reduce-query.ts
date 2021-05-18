import { Query } from "./query";
import { reduceObjectCriteria } from "../criteria";
import { reduceSelection } from "../selection";

// [todo] options reduction missing
export function reduceQuery(a: Query, b: Query): Query[] | false {
    const reducedCriteria = reduceObjectCriteria(a.criteria, b.criteria);
    const reducedSelection = reduceSelection(a.selection, b.selection);

    if (!reducedCriteria || !reducedSelection) {
        return false;
    } else if (reducedCriteria.length == 0) {
        if (Object.keys(reducedSelection).length == 0) {
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
    } else if (Object.keys(reducedSelection).length == 0) {
        return [
            {
                criteria: reducedCriteria,
                model: a.model,
                options: a.options,
                selection: a.selection,
            },
        ];
    } else {
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
    }
}
