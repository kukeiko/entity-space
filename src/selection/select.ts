import { MergeUnion, Class, Unbox } from "../utils";
import { Property, pickProperties, Context } from "../property";
import { Selection } from "./selection";
import { mergeSelections } from "./merge-selections";

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
type PickableSelection<T> = { [K in keyof Selection<T>]-?: K };

/**
 * Type required to generate a dynamic type where each selectable property on a type T is expressed
 * as a function that can be called & chained. See a bit below, there is an actual example using TreeNode.
 *
 * [todo] no support for unions yet
 */
type Selector<T, M = {}> = {
    // [todo] i removed "<O extends Selector<MergeUnion<T>[K]>>" constraint and performance seems better. is that really the case or am i dreaming?
    // also, performance does get worse again if "Selection" includes all properties.
    [K in Property.Keys<MergeUnion<T>, Context.Has<"loadable", boolean, true>>]: <O>(
        /**
         * With expand we can select properties of a nested type like references & children.
         */
        expand?: (selector: Selector<Property.UnboxedValue<MergeUnion<T>[K]>>) => O
    ) => Selector<T, M & Record<K, O extends undefined ? true : O extends Selector<any> ? ({} extends O[typeof Selected] ? true : O[typeof Selected]) : true>>;
} & { [Selected]: M };

export function select<T extends Class[], O>(models: T, pick: (selector: Selector<Unbox<Unbox<T>>>) => Selector<Unbox<Unbox<T>>, O>): O {
    let properties: Record<string, Property> = {};

    for (const model of models) {
        properties = {
            ...properties,
            ...pickProperties(new model()),
        };
    }

    const selector: Record<string, Function> = {};
    const selected: Record<string, any> = {};

    // [todo] code is dirty
    for (const key in properties) {
        selector[key] = (expand?: (x: any) => any) => {
            if (selected[key] === void 0) {
                selected[key] = true;
            }

            if (expand !== void 0) {
                let expandedModel = properties[key].value;

                if (!(expandedModel instanceof Array)) {
                    expandedModel = [expandedModel];
                }

                if (selected[key] === true) {
                    selected[key] = {};
                }

                selected[key] = mergeSelections(selected[key], select(expandedModel, expand));
            }

            return selector;
        };
    }

    pick(selector as any);

    return selected as O;
}
