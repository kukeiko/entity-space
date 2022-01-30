import { reduceExpansion } from "../expansion/reduce-expansion.fn";
import { Query } from "./query";

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
export function reduceQuery(a: Query, b: Query): Query[] | false {
    const criteria =
        b.getCriteria() === void 0
            ? true
            : a.getCriteria() === void 0
            ? false
            : b.getCriteria().reduce(a.getCriteria());

    const expansion = reduceExpansion(a.getExpansion(), b.getExpansion());

    if (!criteria || !expansion) {
        return false;
    } else if (criteria === true) {
        if (Object.keys(expansion).length == 0) {
            return [];
        }

        const query = new Query(a.getEntitySchema(), a.getCriteria(), expansion);
        return [query];
    } else if (Object.keys(expansion).length == 0) {
        const query = new Query(a.getEntitySchema(), criteria, a.getExpansion());
        return [query];
    } else {
        return [
            new Query(a.getEntitySchema(), criteria, a.getExpansion()),
            new Query(a.getEntitySchema(), b.getCriteria(), expansion),
        ];
    }
}
