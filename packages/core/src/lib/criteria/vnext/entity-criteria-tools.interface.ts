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
import { INotEqualsCriterion } from "./not-equals/not-equals-criterion.interface";
import { INotInArrayCriterion } from "./not-in-array/not-in-array-criterion.interface";
import { INoneCriterion } from "./none/none-criterion.interface";
import { IOrCriterion } from "./or/or-criterion.interface";
import { INeverCriterion } from "./never/never-criterion.interface";
import { ISomeCriterion } from "./some/some-criterion.interface";
import { IEveryCriterion } from "./every/every-criterion.interface";

// [todo] rename (clashes with WhereEntity)
export type EntityWhere<T> = {
    [K in keyof T]?:
        | EntityWhere<Unbox<T[K]>>
        | ReturnType<Primitive | typeof Null>
        | ReturnType<Primitive | typeof Null>[]
        | ICriterion;
};

export interface IEntityCriteriaTools {
    all(): IAllCriterion;
    none(): INoneCriterion;
    and(...criteria: ICriterion[] | ICriterion[][]): IAndCriterion;
    or(...criteria: ICriterion[] | ICriterion[][]): IOrCriterion;
    equals(value: ReturnType<Primitive | typeof Null>): IEqualsCriterion;
    every(criterion: ICriterion): IEveryCriterion;
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
    isAllCriterion(value: unknown): value is IAllCriterion;
    isEntityCriteria(value: unknown): value is IEntityCriteria;
    isEqualsCriterion(value: unknown): value is IEqualsCriterion;
    isEveryCriterion(value: unknown): value is IEveryCriterion;
    isInArrayCriterion(value: unknown): value is IInArrayCriterion;
    isSomeCriterion(value: unknown): value is ISomeCriterion;
    createCriterionFromEntities(entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion;
}
