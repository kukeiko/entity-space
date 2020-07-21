import { Selection } from "./selection";
import { copySelection } from "./copy-selection";

export function reduceSelection(a: Selection.Untyped, b: Selection.Untyped): Selection.Untyped | null {
    if (Object.keys(a).length === 0) {
        return null;
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
            const subReduced = reduceSelection(reduced[key] as Selection.Untyped, b[key] as Selection.Untyped);

            if (subReduced === null) {
                delete reduced[key];
                didReduce = true;
            } else if (subReduced === reduced[key]) {
                continue;
            } else {
                reduced[key] = subReduced;
                didReduce = true;
            }
        }
    }

    if (!didReduce) {
        return a;
    } else if (Object.keys(reduced).length === 0) {
        return null;
    } else {
        return reduced;
    }
}
