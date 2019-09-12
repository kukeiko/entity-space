import { Component } from "../component";
import { Filter } from "../filter";

/**
 * [notes]
 * - criteria chained via functions on same builder are combined with "and"
 * - "or" happens via using multiple criterion builders (array @ Query.select())
 * - "and" across multiple properties (e.g. "('level' < 7 and 'type' in (6, 38)) or ('level' < 13 and 'type' in (6))")
 *   is done by using filter group names.
 * 
 * - as soon as you export this via "Query.CriterionBuilder" the language server just kinda dies. so we don't do it.
 *
 * [todo] support null if primitive is nullable
 */
export class CriterionBuilder<T extends Component.Primitive.ValueType> {
    // [note] is null if criteria have been combined that won't ever be reachable
    private _criterion?: Filter.Criterion | null = null;

    private _group: string = "default";

    private _combine(criterion: Filter.Criterion): this {
        if (this._criterion === null) return this;

        if (this._criterion === undefined) {
            this._criterion = criterion;
        } else {
            this._criterion = Filter.combineCriterion(this._criterion, criterion);
        }

        return this;
    }

    group(name: string = "default"): this {
        this._group = name;

        return this;
    }

    equals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.equals(value, invert));
    }

    notEquals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.notEquals(value, invert));
    }

    from(value: ReturnType<T>, inclusive = false): this {
        if (typeof (value) !== "string" && typeof (value) !== "number") {
            throw "";
        }

        return this._combine(Filter.from(value, inclusive));
    }

    to(value: ReturnType<T>, inclusive = false): this {
        if (typeof (value) !== "string" && typeof (value) !== "number") {
            throw "";
        }

        return this._combine(Filter.to(value, inclusive));
    }

    fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: boolean | [boolean, boolean] = true): this {
        let from = values[0];
        let to = values[1];

        if (typeof (from) !== "string" && typeof (from) !== "number") {
            throw "";
        }

        if (typeof (to) !== "string" && typeof (to) !== "number") {
            throw "";
        }

        return this._combine(Filter.fromTo([from, to], inclusive));
    }

    in(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.memberOf(values, invert));
    }

    notIn(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.notMemberOf(values, invert));
    }
}

type Foo = ReturnType<NumberConstructor>;
