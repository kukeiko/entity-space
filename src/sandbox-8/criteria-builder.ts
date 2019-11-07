import { Property } from "./property";
import { Primitive } from "./lang";
import { Flagged } from "./flag";

export class CriteraBuilder<T> {
    equals<
        P extends Property
        & Flagged<"filterable">
        & { value: Primitive; }
    >(select: (properties: T) => P, value: ReturnType<P["value"]>): this;

    equals(...args: any[]) {
        return this;
    }

    select<
        P extends Property
        & Flagged<"expandable">
    >(
        select: (properties: T) => P,
        filter: (criteriaBuilder: CriteraBuilder<P["value"]>) => any
    ): this {
        return this;
    }
}
