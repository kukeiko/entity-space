import { Unbox } from "../utils";
import { Selection } from "./selection";

/**
 * Our dynamic selection object needs to store the already selected shape somehow,
 * and we're using a symbol to prevent naming collision (so that users are not restricted in the naming of their data properties).
 */
const Selected = Symbol();

/**
 * Intermediate helper type required for the Selector type above.
 *
 * [todo] this can probably removed and the Selector type be simplified.
 */
type PickableSelection<T> = { [K in keyof Selection<T>]-?: K };

/**
 * Type required to generate a dynamic type where each selectable property on a type T is expressed
 * as a function that can be called & chained. See a bit below, there is an actual example using TreeNode.
 */
export type Selector<T, M = {}> = {
    [K in keyof PickableSelection<T>]: <O extends Selector<T[K]>>(
        /**
         * With expand we can select properties of a nested type like references & children.
         */
        expand?: (selector: Selector<Exclude<Unbox<T[K]>, null | undefined>>) => O
    ) => Selector<T, M & Record<K, O extends undefined ? true : {} extends O[typeof Selected] ? true : O[typeof Selected]>>;
} & { [Selected]: M };
