import { Null, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { IEntitySchema } from "../../schema/schema.interface";
import { IAllCriterion } from "./all/all-criterion.interface";
import { IAndCriterion } from "./and/and-criterion.interface";
import { IIsEvenCriterion } from "./binary/is-even-criterion.interface";
import { IIsOddCriterion } from "./binary/is-odd-criterion.interface";
import { ICriterion } from "./criterion.interface";
import { IEntityCriteria } from "./entity-criteria/entity-criteria.interface";
import { IEqualsCriterion } from "./equals/equals-criterion.interface";
import { IInArrayCriterion } from "./in-array/in-array-criterion.interface";
import { IInNumberRangeCriterion } from "./in-range/in-number-range-criterion.interface";
import { IInStringRangeCriterion } from "./in-range/in-string-range-criterion.interface";
import { INotEqualsCriterion } from "./not-equals-value/not-equals-criterion.interface";
import { INotInArrayCriterion } from "./not-in-array/not-in-array-criterion.interface";
import { INoneCriterion } from "./none/none-criterion.interface";
import { IOrCriterion } from "./or/or-criterion.interface";
import { INeverCriterion } from "./never/never-criterion.interface";
import { ISomeCriterion } from "./some/some-criterion.interface";

export type EntityWhere<T> = {
    [K in keyof T]?:
        | ICriterion
        | ReturnType<Primitive | typeof Null>
        | ReturnType<Primitive | typeof Null>[]
        | EntityWhere<Unbox<T[K]>>;
};

export interface IEntityCriteriaFactory {
    all(): IAllCriterion;
    none(): INoneCriterion;
    and(...criteria: ICriterion[] | ICriterion[][]): IAndCriterion;
    or(...criteria: ICriterion[] | ICriterion[][]): IOrCriterion;
    equals(value: ReturnType<Primitive | typeof Null>): IEqualsCriterion;
    never(): INeverCriterion;
    notEquals(value: ReturnType<Primitive | typeof Null>): INotEqualsCriterion;
    isEven(): IIsEvenCriterion;
    isOdd(): IIsOddCriterion;
    inArray(values: Iterable<ReturnType<Primitive | typeof Null>>): IInArrayCriterion;
    inRange(
        from?: number | string,
        to?: number | string,
        inclusive?: boolean | [boolean, boolean]
    ): IInStringRangeCriterion | IInNumberRangeCriterion;
    notInArray(values: Iterable<ReturnType<Primitive | typeof Null>>): INotInArrayCriterion;
    some(criterion: ICriterion): ISomeCriterion;
    where<T extends Entity = Entity>(criteria: EntityWhere<T>): IEntityCriteria;
}
