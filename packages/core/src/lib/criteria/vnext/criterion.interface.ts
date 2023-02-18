export const ICriterion$ = Symbol();

export interface ICriterion {
    readonly [ICriterion$]: true;
    equivalent(other: ICriterion): boolean;
    intersect(other: ICriterion): false | ICriterion;
    invert(): false | ICriterion;
    contains(value: unknown): boolean;
    filter<T>(items: T[]): T[];
    // [todo] rename to plus?
    merge(other: ICriterion): false | ICriterion;
    minus(other: ICriterion): boolean | ICriterion;
    simplify(): ICriterion;
    // [todo] to be removed in favor of minus()
    subtractFrom(other: ICriterion): boolean | ICriterion;
    toString(): string;
}
