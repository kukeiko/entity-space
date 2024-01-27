import { Null, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../schema/schema.interface";
import { IAllCriterion } from "./all/all-criterion.interface";
import { IAndCriterion } from "./and/and-criterion.interface";
import { IIsEvenCriterion } from "./binary/is-even-criterion.interface";
import { IIsOddCriterion } from "./binary/is-odd-criterion.interface";
import { ICriterion } from "./criterion.interface";
import { IEntityCriteria } from "./entity-criteria/entity-criteria.interface";
import { IEqualsCriterion } from "./equals/equals-criterion.interface";
import { IEveryCriterion } from "./every/every-criterion.interface";
import { IInArrayCriterion } from "./in-array/in-array-criterion.interface";
import { IInNumberRangeCriterion } from "./in-range/in-number-range-criterion.interface";
import { IInStringRangeCriterion } from "./in-range/in-string-range-criterion.interface";
import { INeverCriterion } from "./never/never-criterion.interface";
import { INoneCriterion } from "./none/none-criterion.interface";
import { INotEqualsCriterion } from "./not-equals/not-equals-criterion.interface";
import { INotInArrayCriterion } from "./not-in-array/not-in-array-criterion.interface";
import { IOrCriterion } from "./or/or-criterion.interface";
import { ISomeCriterion } from "./some/some-criterion.interface";

// [todo] rename (clashes with WhereEntity)
export type EntityWhere<T> = {
    [K in keyof T]?:
        | EntityWhere<Unbox<T[K]>>
        | ReturnType<Primitive | typeof Null>
        | ReturnType<Primitive | typeof Null>[]
        | ICriterion;
};

export interface IEntityCriteriaTools {
    toDestructurable(): IEntityCriteriaTools;
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
    isCriterion(value: unknown): value is ICriterion;
    isAllCriterion(value: unknown): value is IAllCriterion;
    isAndCriterion(value: unknown): value is IAndCriterion;
    isEntityCriteria(value: unknown): value is IEntityCriteria;
    isEqualsCriterion(value: unknown): value is IEqualsCriterion;
    isEvenCriterion(value: unknown): value is IIsEvenCriterion;
    isEveryCriterion(value: unknown): value is IEveryCriterion;
    isInArrayCriterion(value: unknown): value is IInArrayCriterion;
    isInNumberRangeCriterion(value: unknown): value is IInNumberRangeCriterion;
    isInStringRangeCriterion(value: unknown): value is IInStringRangeCriterion;
    isNeverCriterion(value: unknown): value is INeverCriterion;
    isNoneCriterion(value: unknown): value is INoneCriterion;
    isNotEqualsCriterion(value: unknown): value is INotEqualsCriterion;
    isNotInArrayCriterion(value: unknown): value is INotInArrayCriterion;
    isOddCriterion(value: unknown): value is IIsOddCriterion;
    isOrCriterion(value: unknown): value is IOrCriterion;
    isSomeCriterion(value: unknown): value is ISomeCriterion;
    createCriterionFromEntities(entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion;
    omitRelationalCriteria(criterion: ICriterion, schema: IEntitySchema): ICriterion;
}
