import { StaticType, DynamicType } from "./type";
import { TypeSelector } from "./type-selector";
import { CriteraBuilder } from "./criteria-builder";

export type QueriedType<T extends StaticType, S extends DynamicType<T>, C extends CriteraBuilder<S>>
    = {
        selected: S;
        criteria: C;
    };

export class TypeQuery<T extends StaticType, S extends DynamicType<T> = {} & DynamicType<T>> {
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

    where(filter: (criteriaBuilder: CriteraBuilder<S>) => any): this;
    where(operand: "and" | "or", filter: (criteriaBuilder: CriteraBuilder<S>) => any): this;

    where(...args: any[]): this {
        return this;
    }
    
    build(): QueriedType<T, S, CriteraBuilder<S>> {
        return {
            selected: this._selector.build(),
            criteria: {} as CriteraBuilder<S>
        };
    }
}
