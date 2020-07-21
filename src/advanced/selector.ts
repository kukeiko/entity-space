import { MergeUnion } from "../utils";
import { ModelSelection } from "./selection";
import { Property } from "../property/property";
import { pickProperties } from "../property/pick-properties";

/**
 * Our dynamic selection object needs to store the already selected shape somehow,
 * and we're using a symbol to prevent naming collision (so that users are not restricted in the naming of their data properties).
 */
export const Selected = Symbol();

/**
 * Intermediate helper type required for the ObjectSelector type above.
 *
 * [todo] this can probably removed and the ObjectSelector type be simplified.
 */
type PickableSelection<T> = { [K in keyof ModelSelection<T>]-?: K };

/**
 * Type required to generate a dynamic type where each selectable property on a type T is expressed
 * as a function that can be called & chained. See a bit below, there is an actual example using TreeNode.
 *
 * [todo] no support for unions yet
 */
export type ObjectSelector<T, M = {}> = {
    [K in keyof PickableSelection<T>]: <O extends ObjectSelector<MergeUnion<T>[K]>>(
        /**
         * With expand we can select properties of a nested type like references & children.
         */
        expand?: (selector: ObjectSelector<Property.UnboxedValue<MergeUnion<T>[K]>>) => O
    ) => ObjectSelector<T, M & Record<K, O extends undefined ? true : {} extends O[typeof Selected] ? true : O[typeof Selected]>>;
} & { [Selected]: M };

export function select<T, O>(model: T, pick: (selector: ObjectSelector<T>) => ObjectSelector<T, O>): O {
    const properties = pickProperties(model);
    const selector: Record<string, Function> = {};
    const selected: Record<string, any> = {};

    // [todo] code is dirty
    for (const key in properties) {
        selector[key] = (expand?: (x: any) => any) => {
            if (selected[key] === void 0) {
                selected[key] = true;
            }

            if (expand !== void 0) {
                const expandedModel = new properties[key].value();

                if (selected[key] === true) {
                    selected[key] = {};
                }

                selected[key] = ModelSelection.merge(selected[key], select(expandedModel, expand));
            }
        };
    }

    pick(selector as any);

    return selected as O;
}
