import {
    isPrimitiveOrNull,
    isPrimitiveOrNullNoCustomArg,
    Null,
    Primitive,
    readPath,
    writePath,
} from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { AllCriterion } from "./all/all-criterion";
import { IAllCriterion, IAllCriterion$ } from "./all/all-criterion.interface";
import { AndCriterion } from "./and/and-criterion";
import { IAndCriterion, IAndCriterion$ } from "./and/and-criterion.interface";
import { IsEvenCriterion } from "./binary/is-even-criterion";
import { IIsEvenCriterion, IIsEvenCriterion$ } from "./binary/is-even-criterion.interface";
import { IsOddCriterion } from "./binary/is-odd-criterion";
import { IIsOddCriterion, IIsOddCriterion$ } from "./binary/is-odd-criterion.interface";
import { ICriterion, ICriterion$ } from "./criterion.interface";
import { EntityWhere, IEntityCriteriaTools } from "./entity-criteria-tools.interface";
import { EntityCriteria } from "./entity-criteria/entity-criteria";
import { IEntityCriteria, IEntityCriteria$ } from "./entity-criteria/entity-criteria.interface";
import { IEqualsCriterion, IEqualsCriterion$ } from "./equals/equals-criterion.interface";
import { EqualsCriterion } from "./equals/equals-criterion";
import { InArrayCriterion } from "./in-array/in-array-criterion";
import { IInArrayCriterion, IInArrayCriterion$ } from "./in-array/in-array-criterion.interface";
import { IInNumberRangeCriterion, IInNumberRangeCriterion$ } from "./in-range/in-number-range-criterion.interface";
import { InNumberRangeCriterion } from "./in-range/in-number-range-criterion";
import { InStringRangeCriterion } from "./in-range/in-string-range-criterion";
import { IInStringRangeCriterion, IInStringRangeCriterion$ } from "./in-range/in-string-range-criterion.interface";
import { INotEqualsCriterion, INotEqualsCriterion$ } from "./not-equals/not-equals-criterion.interface";
import { NotEqualsCriterion } from "./not-equals/not-equals-criterion";
import { NotInArrayCriterion } from "./not-in-array/not-in-array-criterion";
import { INotInArrayCriterion, INotInArrayCriterion$ } from "./not-in-array/not-in-array-criterion.interface";
import { NoneCriterion } from "./none/none-criterion";
import { INoneCriterion, INoneCriterion$ } from "./none/none-criterion.interface";
import { OrCriterion } from "./or/or-criterion";
import { IOrCriterion, IOrCriterion$ } from "./or/or-criterion.interface";
import { NeverCriterion } from "./never/never-criterion";
import { INeverCriterion, INeverCriterion$ } from "./never/never-criterion.interface";
import { ISomeCriterion, ISomeCriterion$ } from "./some/some-criterion.interface";
import { SomeCriterion } from "./some/some-criterion";
import { EveryCriterion } from "./every/every-criterion";
import { IEveryCriterion, IEveryCriterion$ } from "./every/every-criterion.interface";
import { ComplexKeyMap } from "../../entity/data-structures/complex-key-map";
import { hasInterfaceMarker } from "./has-interface-marker.fn";

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class EntityCriteriaTools implements IEntityCriteriaTools {
    all = (): IAllCriterion => {
        return new AllCriterion({ tools: this });
    };

    none = (): INoneCriterion => {
        return new NoneCriterion({ tools: this });
    };

    and = (...criteria: ICriterion[] | ICriterion[][]): IAndCriterion => {
        criteria = Array.isArray(criteria[0]) ? (criteria[0] as ICriterion[]) : (criteria as ICriterion[]);

        return new AndCriterion({ criteria, tools: this });
    };

    or = (...criteria: ICriterion[] | ICriterion[][]): IOrCriterion => {
        criteria = Array.isArray(criteria[0]) ? (criteria[0] as ICriterion[]) : (criteria as ICriterion[]);

        return new OrCriterion({ criteria, tools: this });
    };

    equals = (value: PrimitiveValue): IEqualsCriterion => {
        return new EqualsCriterion({ value, tools: this });
    };

    every = (criterion: ICriterion): IEveryCriterion => new EveryCriterion({ criterion, tools: this });

    never = (): INeverCriterion => new NeverCriterion({ tools: this });

    notEquals = (value: PrimitiveValue): INotEqualsCriterion => {
        return new NotEqualsCriterion({ value, tools: this });
    };

    isEven = (): IIsEvenCriterion => {
        return new IsEvenCriterion({ tools: this });
    };

    isOdd = (): IIsOddCriterion => {
        return new IsOddCriterion({ tools: this });
    };

    inArray = (values: Iterable<PrimitiveValue>): IInArrayCriterion => {
        return new InArrayCriterion({ values: Object.freeze(new Set(values)), tools: this });
    };

    notInArray = (values: Iterable<PrimitiveValue>): INotInArrayCriterion => {
        return new NotInArrayCriterion({ values: Object.freeze(new Set(values)), tools: this });
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

    some = (criterion: ICriterion): ISomeCriterion => new SomeCriterion({ criterion, tools: this });

    where = <T extends Entity = Entity>(criteria: EntityWhere<T>): IEntityCriteria => {
        const built: Record<string, ICriterion> = {};

        for (const key in criteria) {
            const value = criteria[key];

            if (isPrimitiveOrNull(value)) {
                built[key] = this.equals(value);
            } else if (Array.isArray(value) && value.every(isPrimitiveOrNullNoCustomArg)) {
                built[key] = this.inArray(value);
            } else if (this.isCriterion(value)) {
                built[key] = value;
            } else if (value !== void 0) {
                built[key] = this.where(value);
            }
        }

        return new EntityCriteria({ criteria: built, tools: this });
    };

    isCriterion = (value: unknown): value is ICriterion => {
        return hasInterfaceMarker(ICriterion$, value);
    };

    isAllCriterion = (value: unknown): value is IAllCriterion => {
        return hasInterfaceMarker(IAllCriterion$, value);
    };

    isAndCriterion = (value: unknown): value is IAndCriterion => {
        return hasInterfaceMarker(IAndCriterion$, value);
    };

    isEntityCriteria = (value: unknown): value is IEntityCriteria => {
        return hasInterfaceMarker(IEntityCriteria$, value);
    };

    isEqualsCriterion = (value: unknown): value is IEqualsCriterion => {
        return hasInterfaceMarker(IEqualsCriterion$, value);
    };

    isEvenCriterion = (value: unknown): value is IIsEvenCriterion => {
        return hasInterfaceMarker(IIsEvenCriterion$, value);
    };

    isEveryCriterion = (value: unknown): value is IEveryCriterion => {
        return hasInterfaceMarker(IEveryCriterion$, value);
    };

    isInArrayCriterion = (value: unknown): value is IInArrayCriterion => {
        return hasInterfaceMarker(IInArrayCriterion$, value);
    };

    isInNumberRangeCriterion = (value: unknown): value is IInNumberRangeCriterion => {
        return hasInterfaceMarker(IInNumberRangeCriterion$, value);
    };

    isInStringRangeCriterion = (value: unknown): value is IInStringRangeCriterion => {
        return hasInterfaceMarker(IInStringRangeCriterion$, value);
    };

    isNeverCriterion = (value: unknown): value is INeverCriterion => {
        return hasInterfaceMarker(INeverCriterion$, value);
    };

    isNoneCriterion = (value: unknown): value is INoneCriterion => {
        return hasInterfaceMarker(INoneCriterion$, value);
    };

    isNotEqualsCriterion = (value: unknown): value is INotEqualsCriterion => {
        return hasInterfaceMarker(INotEqualsCriterion$, value);
    };

    isNotInArrayCriterion = (value: unknown): value is INotInArrayCriterion => {
        return hasInterfaceMarker(INotInArrayCriterion$, value);
    };

    isOddCriterion = (value: unknown): value is IIsOddCriterion => {
        return hasInterfaceMarker(IIsOddCriterion$, value);
    };

    isOrCriterion = (value: unknown): value is IOrCriterion => {
        return hasInterfaceMarker(IOrCriterion$, value);
    };

    isSomeCriterion = (value: unknown): value is ISomeCriterion => {
        return hasInterfaceMarker(ISomeCriterion$, value);
    };

    createCriterionFromEntities = (entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion => {
        if (paths.length === 1) {
            return this.createCriterionOnePath(entities, paths[0], writtenPaths ? writtenPaths[0] : void 0);
        } else {
            return this.createCriterionManyPaths(entities, paths, writtenPaths);
        }
    };

    private createCriterionOnePath(entities: Entity[], path: string, writtenPath = path): ICriterion {
        const readValue = (entity: Entity): any => readPath(path, entity);
        const set = new Set<any>();

        for (const entity of entities) {
            const value = readValue(entity);

            if (value === void 0) {
                continue;
            }

            set.add(value);
        }

        const bag: Record<string, any> = {};
        writePath(writtenPath, bag, this.inArray(set));

        return this.where(bag);
    }

    private createCriterionManyPaths(entities: Entity[], paths: string[], writtenPaths?: string[]): ICriterion {
        const leadingPaths = paths.slice(0, -1);
        const lastPath = paths[paths.length - 1];
        const writtenLastPath = writtenPaths ? writtenPaths[paths.length - 1] : lastPath;
        type Bag = Record<string, unknown>;
        const map = new ComplexKeyMap<Entity, Bag>(leadingPaths);

        for (const entity of entities) {
            const bag: Bag = {};
            let hasUndefinedValue = false;

            for (let i = 0; i < leadingPaths.length; ++i) {
                const path = leadingPaths[i];
                const writtenPath = writtenPaths ? writtenPaths[i] : path;
                const value = readPath(path, entity);

                if (value === void 0) {
                    hasUndefinedValue = true;
                    break;
                }

                // [todo] unsafe assertion
                writePath(writtenPath, bag, this.equals(value as any));
            }

            if (hasUndefinedValue) {
                continue;
            }

            // [todo] could squeeze out more performance if ComplexKeyMap accepts a method for value,
            // just like it does for update.
            writePath(writtenLastPath, bag, this.inArray([readPath(lastPath, entity)!]));

            map.set(entity, bag, (previous, current) => {
                const previousSet = readPath(writtenLastPath, previous) as IInArrayCriterion;
                const currentSet = readPath(writtenLastPath, current) as IInArrayCriterion;
                writePath(
                    writtenLastPath,
                    previous,
                    this.inArray([...previousSet.getValues(), ...currentSet.getValues()])
                );

                return previous;
            });
        }

        // [todo] type assertion
        return this.or(map.getAll().map(bag => this.where(bag as any)));
    }
}
