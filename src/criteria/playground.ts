import { ValueCriterion } from "../criteria/value-criterion";
import { InNumberRangeCriterion } from "./value-criterion/range/in-number-range-criterion";
import { InNumberSetCriterion } from "./value-criterion/set/in-number-set-criterion";
import { InStringRangeCriterion } from "./value-criterion/range/in-string-range-criterion";

export function Void(): undefined {
    return void 0;
}

export function Null(): null {
    return null;
}

const anySymbol: Symbol = Symbol("any");

export function Any(): any {
    return anySymbol;
}

export class ValueType<T extends () => any = () => any> {
    constructor(constructors: Iterable<T>) {
        this.constructors = Array.from(constructors);
        this.defaultValues = this.constructors.map(ctor => ctor());
    }

    readonly constructors: ReadonlyArray<T>;
    readonly defaultValues: ReadonlyArray<ReturnType<T>>;

    static Any(): ValueType {
        return new ValueType([Any]);
    }
}

export type ValueOfValueType<T extends ValueType> = T["defaultValues"][number];

const inNumberSet = new InNumberSetCriterion([1, 2, 3]);
const inNumberRange = new InStringRangeCriterion(["1", "3"]);

const reduced = inNumberSet.reduce(inNumberRange);
type ShouldBeFalse = ValueCriterion<string> extends ValueCriterion<number> ? true : false;

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }
