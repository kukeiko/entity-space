import { Property, pickProperties } from "../property";
import { MergeUnion, Class } from "../utils";
import { Selection, mergeSelections } from "../selection";

export class TypedSelector<T, M = {}> {
    constructor(models: Class<T>[]) {
        let merged: Record<string, Property> = {};

        for (const model of models) {
            merged = { ...merged, ...pickProperties(new model()) };
        }

        this._modelInstance = merged;
    }

    private _modelInstance: any;
    private _selected: Selection = {};

    select<O extends Property>(pick: (model: MergeUnion<T>) => O): TypedSelector<T, M & Record<O["key"], true>>;
    select<O extends Property, E extends TypedSelector<any>>(
        pick: (model: MergeUnion<T>) => O,
        expand: (selector: TypedSelector<Property.UnboxedValue<O>>) => E
    ): TypedSelector<T, M & Record<O["key"], ReturnType<E["get"]>>>;
    select(...args: any[]): any {
        const pick: (model: any) => Property = args[0];
        const expand: ((selector: TypedSelector<any>) => TypedSelector<any>) | undefined = args[1];

        const pickedProperty = pick(this._modelInstance);
        const selected: true | Selection = expand === void 0 ? true : expand(new TypedSelector(pickedProperty.value as any)).get();
        const current = this._selected[pickedProperty.key];

        if (current === void 0 || current === true) {
            this._selected[pickedProperty.key] = selected;
        } else {
            this._selected[pickedProperty.key] = mergeSelections(current, selected);
        }

        return this;
    }

    get(): M {
        return this._selected as any;
    }
}
