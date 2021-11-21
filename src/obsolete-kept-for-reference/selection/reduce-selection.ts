import { Selection } from "./selection";
import { copySelection } from "./copy-selection";

export function reduceSelection(a: Selection, b: Selection): Selection | false {
    if (Object.keys(a).length === 0) {
        return {};
    }

    const reduced = copySelection(a);
    let didReduce = false;

    for (const key in b) {
        if (a[key] === void 0) {
            continue;
        } else if (b[key] === true) {
            delete reduced[key];
            didReduce = true;
        } else if (b[key] instanceof Object) {
            const subReduced = reduceSelection(reduced[key] as Selection, b[key] as Selection);

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
