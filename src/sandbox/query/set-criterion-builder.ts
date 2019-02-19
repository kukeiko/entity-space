import { Component } from "../component";

export class SetCriterionBuilder<T extends Component.Primitive.ValueType> {
    intersectsWith(values: Iterable<ReturnType<T>>): this {
        return this;
    }

    isSubsetOf(values: Iterable<ReturnType<T>>): this {
        return this;
    }

    isSupersetOf(values: Iterable<ReturnType<T>>): this {
        return this;
    }
}
