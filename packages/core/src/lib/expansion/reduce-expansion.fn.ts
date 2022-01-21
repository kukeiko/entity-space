import { copyExpansion } from "./copy-expansion.fn";
import { Expansion } from "./expansion";

export function reduceExpansion(a: Expansion, b: Expansion): Expansion | false {
    if (Object.keys(a).length === 0) {
        return {};
    }

    const reduced = copyExpansion(a);
    let didReduce = false;

    for (const key in b) {
        if (a[key] === void 0) {
            continue;
        } else if (b[key] === true) {
            if (a[key] === true || Object.keys(a[key] ?? {}).length === 0) {
                delete reduced[key];
                didReduce = true;
            }
        } else if (b[key] instanceof Object) {
            const subReduced = reduceExpansion(reduced[key] as Expansion, b[key] as Expansion);

            if (!subReduced) {
                continue;
            } else if (Object.keys(subReduced).length === 0) {
                delete reduced[key];
                didReduce = true;
            } else {
                reduced[key] = subReduced;
                didReduce = true;
            }
        }
    }

    return didReduce ? reduced : false;
}
