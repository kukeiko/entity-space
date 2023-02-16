import { isPrimitiveOrNull, isPrimitiveOrNullNoCustomArg, Null, Primitive } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { AllCriterion } from "./all/all-criterion";
import { IAllCriterion } from "./all/all-criterion.interface";
import { AndCriterion } from "./and/and-criterion";
import { IAndCriterion } from "./and/and-criterion.interface";
import { IsEvenCriterion } from "./binary/is-even-criterion";
import { IIsEvenCriterion } from "./binary/is-even-criterion.interface";
import { IsOddCriterion } from "./binary/is-odd-criterion";
import { IIsOddCriterion } from "./binary/is-odd-criterion.interface";
import { ICriterion } from "./criterion.interface";
import { EntityWhere, IEntityCriteriaFactory } from "./entity-criteria-factory.interface";
import { EntityCriteria } from "./entity-criteria/entity-criteria";
import { IEntityCriteria } from "./entity-criteria/entity-criteria.interface";
import { IEqualsCriterion } from "./equals/equals-criterion.interface";
import { EqualsCriterion } from "./equals/equals-criterion";
import { InArrayCriterion } from "./in-array/in-array-criterion";
import { IInArrayCriterion } from "./in-array/in-array-criterion.interface";
import { IInNumberRangeCriterion } from "./in-range/in-number-range-criterion.interface";
import { InNumberRangeCriterion } from "./in-range/in-number-range-criterion";
import { InStringRangeCriterion } from "./in-range/in-string-range-criterion";
import { IInStringRangeCriterion } from "./in-range/in-string-range-criterion.interface";
import { INotEqualsCriterion } from "./not-equals-value/not-equals-criterion.interface";
import { NotEqualsCriterion } from "./not-equals-value/not-equals-criterion";
import { NotInArrayCriterion } from "./not-in-array/not-in-array-criterion";
import { INotInArrayCriterion } from "./not-in-array/not-in-array-criterion.interface";
import { NoneCriterion } from "./none/none-criterion";
import { INoneCriterion } from "./none/none-criterion.interface";
import { OrCriterion } from "./or/or-criterion";
import { IOrCriterion } from "./or/or-criterion.interface";
import { NeverCriterion } from "./never/never-criterion";
import { INeverCriterion } from "./never/never-criterion.interface";
import { ISomeCriterion } from "./some/some-criterion.interface";
import { SomeCriterion } from "./some/some-criterion";
import { EveryCriterion } from "./every/every-criterion";
import { IEveryCriterion } from "./every/every-criterion.interface";

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class EntityCriteriaFactory implements IEntityCriteriaFactory {
    all = (): IAllCriterion => {
        return new AllCriterion({ factory: this });
    };

    none = (): INoneCriterion => {
        return new NoneCriterion({ factory: this });
    };

    and = (...criteria: ICriterion[] | ICriterion[][]): IAndCriterion => {
        criteria = Array.isArray(criteria[0]) ? (criteria[0] as ICriterion[]) : (criteria as ICriterion[]);

        return new AndCriterion({ criteria, factory: this });
    };

    or = (...criteria: ICriterion[] | ICriterion[][]): IOrCriterion => {
        criteria = Array.isArray(criteria[0]) ? (criteria[0] as ICriterion[]) : (criteria as ICriterion[]);

        return new OrCriterion({ criteria, factory: this });
    };

    equals = (value: PrimitiveValue): IEqualsCriterion => {
        return new EqualsCriterion({ value, factory: this });
    };

    every = (criterion: ICriterion): IEveryCriterion => new EveryCriterion({ criterion, factory: this });

    never = (): INeverCriterion => new NeverCriterion({ factory: this });

    notEquals = (value: PrimitiveValue): INotEqualsCriterion => {
        return new NotEqualsCriterion({ value, factory: this });
    };

    isEven = (): IIsEvenCriterion => {
        return new IsEvenCriterion({ factory: this });
    };

    isOdd = (): IIsOddCriterion => {
        return new IsOddCriterion({ factory: this });
    };

    inArray = (values: Iterable<PrimitiveValue>): IInArrayCriterion => {
        return new InArrayCriterion({ values: Object.freeze(new Set(values)), factory: this });
    };

    notInArray = (values: Iterable<PrimitiveValue>): INotInArrayCriterion => {
        return new NotInArrayCriterion({ values: Object.freeze(new Set(values)), factory: this });
    };

    inRange = (
        from?: string | number | undefined,
        to?: string | number | undefined,
        inclusive?: boolean | [boolean, boolean] | undefined
    ): IInStringRangeCriterion | IInNumberRangeCriterion => {
        // [todo] what if both from & to are void? previously i returned "all",
        // but because shapes want exact criterion type, i cant do that no more.
        if (isStringOrVoid(from) && isStringOrVoid(to)) {
            return new InStringRangeCriterion([from, to], inclusive, this);
        } else if (isNumberOrVoid(from) && isNumberOrVoid(to)) {
            return new InNumberRangeCriterion([from, to], inclusive, this);
        }

        throw new Error(`invalid arguments`);
    };

    some = (criterion: ICriterion): ISomeCriterion => new SomeCriterion({ criterion, factory: this });

    where = <T extends Entity = Entity>(criteria: EntityWhere<T>): IEntityCriteria => {
        const built: Record<string, ICriterion> = {};

        for (const key in criteria) {
            const value = criteria[key];

            if (isPrimitiveOrNull(value)) {
                built[key] = this.equals(value);
            } else if (Array.isArray(value) && value.every(isPrimitiveOrNullNoCustomArg)) {
                built[key] = this.inArray(value);
            } else if (ICriterion.is(value)) {
                built[key] = value;
            } else if (value !== void 0) {
                built[key] = this.where(value);
            }
        }

        return new EntityCriteria({ criteria: built, factory: this });
    };

    isAllCriterion(value: unknown): value is IAllCriterion {
        return IAllCriterion.is(value);
    }

    isEntityCriteria(value: unknown): value is IEntityCriteria {
        return IEntityCriteria.is(value);
    }

    isEqualsCriterion(value: unknown): value is IEqualsCriterion {
        return IEqualsCriterion.is(value);
    }

    isEveryCriterion(value: unknown): value is IEveryCriterion {
        return IEveryCriterion.is(value);
    }

    isInArrayCriterion(value: unknown): value is IInArrayCriterion {
        return IInArrayCriterion.is(value);
    }

    isSomeCriterion(value: unknown): value is ISomeCriterion {
        return ISomeCriterion.is(value);
    }
}
