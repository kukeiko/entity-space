import { PropertiesOf } from "./property";
import { Filterable } from "./components";
import { EqualityCriterion } from "./criteria";
import { Primitive } from "./lang";

export class CriteraBuilder<T> {
    equals<P extends Filterable & { value: typeof Number; }>(value: number, select: (properties: PropertiesOf<Required<T>, P>) => P): this;
    equals<P extends Filterable & { value: typeof String; }>(value: string, select: (properties: PropertiesOf<Required<T>, P>) => P): this;
    equals<P extends Filterable & { value: typeof Boolean; }>(value: boolean, select: (properties: PropertiesOf<Required<T>, P>) => P): this;

    // equals<P extends Filterable & { value: typeof Number; }>(select: (properties: PropertiesOf<Required<T>, P>) => P, value: number): this;
    // equals<P extends Filterable & { value: typeof String; }>(select: (properties: PropertiesOf<Required<T>, P>) => P, value: string): this;
    // equals<P extends Filterable & { value: typeof Boolean; }>(select: (properties: PropertiesOf<Required<T>, P>) => P, value: boolean): this;

    // equals<P extends Filterable & { value: Primitive; }>(select: (properties: PropertiesOf<T, P>) => P, value: ReturnType<P["value"]>): this;

    // equals<P extends Filterable & { value: Primitive; }>(value: ReturnType<P["value"]>, select: (properties: PropertiesOf<Required<T>, P>) => P): this;

    equals(...args: any[]) {
        return this;
    }
}
