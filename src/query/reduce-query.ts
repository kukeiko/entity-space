import { Query } from "./query";
import { reduceSelection } from "../selection";

// [todo] options reduction missing
export function reduceQuery<T>(a: Query<T>, b: Query<T>): Query<T>[] | false {
    const reducedCriteria = b.criteria.reduce(a.criteria);
    const reducedSelection = reduceSelection(a.selection, b.selection);

    if (!reducedCriteria || !reducedSelection) {
        return false;
    } else if (reducedCriteria === true || reducedCriteria.items.length == 0) {
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
