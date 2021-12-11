import { reduceExpansion } from "../expansion/reduce-expansion.fn";
import { Query } from "./query";

export function reduceQuery(a: Query, b: Query): Query[] | false {
    const criteria = b.criteria === void 0 ? true : a.criteria === void 0 ? false : b.criteria.reduce(a.criteria);
    const expansion = reduceExpansion(a.expansion, b.expansion);

    if (!criteria || !expansion) {
        return false;
    } else if (criteria === true) {
        if (Object.keys(expansion).length == 0) {
            return [];
        }

        return [{ model: a.model, criteria: a.criteria, expansion }];
    } else if (Object.keys(expansion).length == 0) {
        return [{ model: a.model, criteria, expansion: a.expansion }];
    } else {
        return [
            { model: a.model, criteria, expansion: a.expansion },
            { model: a.model, criteria: b.criteria, expansion },
        ];
    }
}
