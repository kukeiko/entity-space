import { Property } from "./property";
import { Primitive } from "./lang";
import { WithAttribute } from "./attribute";

export class CriteraBuilder<T> {
    equals<
        P extends Property<any, any, true>
        & WithAttribute<"filterable">
    >(select: (properties: T) => P, value: ReturnType<P["value"]>): this;

    equals(...args: any[]) {
        return this;
    }

    select<P extends Property<any, any, false>>(
        select: (properties: T) => P,
        filter: (criteriaBuilder: CriteraBuilder<P["value"]>) => any
    ): this {
        return this;
    }
}
