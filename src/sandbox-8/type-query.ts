import { StaticType, DynamicType } from "./type";
import { TypeSelector } from "./type-selector";
import { CriteraBuilder } from "./criteria-builder";

export class TypeQuery<T extends StaticType, S = {} & DynamicType<T>> {
    constructor(type: T) {
        this._type = type;
        this._selector = new TypeSelector<T, S>(type);
    }

    private readonly _type: T;
    private readonly _selector: TypeSelector<T, S>;

    select<O>(select: (selector: TypeSelector<T, S>) => TypeSelector<T, O>): TypeQuery<T, S & O> {
        select(this._selector);
        return this as any;
    }

    where(filter: (criteriaBuilder: CriteraBuilder<S>) => any): this {
        return this;
    }
}
