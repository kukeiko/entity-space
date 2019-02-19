import { Component } from "../component";
import { Filter } from "../filter";

/**
 * [notes]
 * - criteria chained via functions on same builder should be combined
 * => "or" happens via using multiple criterion builders (array @ Query.select())
 *
 * - as soon as you export this via "Query.CriterionBuilder" the language server just kinda dies. so we don't do it.
 *
 * [todo] support null if primitive is nullable
 */
export class CriterionBuilder<T extends Component.Primitive.ValueType> {
    // [note] is null if criteria have been combined that won't ever be reachable
    private _criterion?: Filter.Criterion | null = null;

    private _combine(criterion: Filter.Criterion): this {
        if (this._criterion === null) return this;

        if (this._criterion === undefined) {
            this._criterion = criterion;
        } else {
            this._criterion = Filter.combineCriterion(this._criterion, criterion);
        }

        return this;
    }

    equals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.equals(value, invert));
    }

    notEquals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.notEquals(value, invert));
    }

    from(value: ReturnType<T>, inclusive = false): this {
        return this._combine(Filter.from(value, inclusive));
    }

    to(value: ReturnType<T>, inclusive = false): this {
        return this._combine(Filter.to(value, inclusive));
    }

    fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: boolean | [boolean, boolean] = true): this {
        return this._combine(Filter.fromTo(values, inclusive));
    }

    in(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.memberOf(values, invert));
    }

    notIn(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.notMemberOf(values, invert));
    }
}
