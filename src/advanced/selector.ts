import { ModelSelection } from "./selection";
import { Property } from "./property";

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
    [K in keyof PickableSelection<T>]: <O extends ObjectSelector<T[K]>>(
        /**
         * With expand we can select properties of a nested type like references & children.
         */
        expand?: (ObjectSelector: ObjectSelector<Property.UnboxedValue<T[K]>>) => O
    ) => ObjectSelector<T, M & Record<K, O extends undefined ? true : {} extends O[typeof Selected] ? true : O[typeof Selected]>>;
} & { [Selected]: M };

export function select<T, O>(model: T, pick: (selector: ObjectSelector<T>) => ObjectSelector<T, O>): O {
    const properties = Property.pick(model);
    const selector: Record<string, Function> = {};
    const selected: Record<string, any> = {};

    for (const key in properties) {
        selector[key] = () => (selected[key] = true);
    }

    pick(selector as any);

    return selected as O;
}
