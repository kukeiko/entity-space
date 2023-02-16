import { isPrimitive, Null, permutateEntries, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../../common/entity.type";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { EntityCriteriaFactory } from "../entity-criteria-factory";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { EqualsCriterionShape } from "../equals/equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array/in-array-criterion-shape";
import { IOrCriterion } from "../or/or-criterion.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IEntityCriteria } from "./entity-criteria.interface";

type ExtendEachOther<A, B> = A extends B ? (B extends A ? true : never) : never;

type PrimitiveCriteriaShapeType<T> =
    | T // equals
    | [T] // in-array
    | [T, T] // in-range
    | T[] // equals (multiple primitive types)
    | [T[]] // in-array (multiple primitive types)
    | ICriterionShape<any, any>;

type PrimitiveCriteriaShapeInstance<S> = S extends Primitive | typeof Null
    ? ReturnType<S> // equals
    : S extends [Primitive | typeof Null]
    ? ReturnType<S[0]>[] // in-array
    : S extends [Primitive, Primitive]
    ? ExtendEachOther<S[0], S[1]> extends true
        ? [ReturnType<S[0]> | undefined, ReturnType<S[1]> | undefined] // in-range
        : ReturnType<S[number]> // in-array (multiple primitive types)
    : S extends [(Primitive | typeof Null)[]]
    ? ReturnType<S[0][number]>[] // in-array (multiple primitive types)
    : S extends (Primitive | typeof Null)[]
    ? ReturnType<S[number]> // equals (multiple primitive types)
    : S extends ICriterionShape<infer C, infer V>
    ? C extends ICriterion
        ? V
        : never
    : never;

type EntityCriteriaShapePropertyType<T> = T extends ReturnType<Primitive | typeof Null>
    ? PrimitiveCriteriaShapeType<Primitive | typeof Null>
    : EntityCriteriaShapeType<T>;

type EntityCriteriaShapePropertiesType<E> = {
    [K in keyof E]?: EntityCriteriaShapePropertyType<Unbox<E[K]> | E[K]>;
};

export const $required = Symbol();
export const $optional = Symbol();

type EntityCriteriaShapeRequiredAndOptionalPropertiesType<E> = {
    [$required]?: EntityCriteriaShapePropertiesType<E>;
    [$optional]?: EntityCriteriaShapePropertiesType<E>;
};

function isRequiredAndOptionalPropertiesType(
    value: unknown
): value is EntityCriteriaShapeRequiredAndOptionalPropertiesType<any> {
    if (!value) {
        return false;
    }

    return $required in value || $optional in value;
}

export type EntityCriteriaShapeType<E> =
    | EntityCriteriaShapeRequiredAndOptionalPropertiesType<E>
    | EntityCriteriaShapePropertiesType<E>;

type EntityCriteriaShapePropertyInstance<T, S, R> = T extends ReturnType<Primitive | typeof Null>[]
    ? { array: true }
    : Unbox<T> extends ReturnType<Primitive | typeof Null>
    ? PrimitiveCriteriaShapeInstance<S>
    : T extends any[]
    ? { array: true }
    : EntityCriteriaShapeInstance<T, S, R>;

type EntityCriteriaShapeInstanceRequired<E, S> = {
    [K in keyof (E | S)]-?: EntityCriteriaShapePropertyInstance<
        Unbox<Exclude<E[K], undefined>> | Exclude<E[K], undefined>,
        S[K],
        true
    >;
};

type EntityCriteriaShapeInstanceOptional<E, S> = {
    [K in keyof (E | S)]?: EntityCriteriaShapePropertyInstance<
        Unbox<Exclude<E[K], undefined>> | Exclude<E[K], undefined>,
        S[K],
        false
    >;
};

type EntityCriteriaShapeInstance<E, S, R = true> = S extends EntityCriteriaShapeRequiredAndOptionalPropertiesType<any>
    ? EntityCriteriaShapeInstanceRequired<E, S[typeof $required]> &
          EntityCriteriaShapeInstanceOptional<E, S[typeof $optional]>
    : R extends true
    ? EntityCriteriaShapeInstanceRequired<E, S>
    : EntityCriteriaShapeInstanceOptional<E, S>;

export type EntityCriteriaInternalShapeType = {
    [$required]: Record<string, ICriterionShape>;
    [$optional]: Record<string, ICriterionShape>;
};

// [todo] not used
function isPrimitiveCriteriaJsonShape(value: unknown): value is PrimitiveCriteriaShapeType<unknown> {
    if (!value) {
        return false;
    }

    const isPrimitiveOrNull = (item: unknown) => isPrimitive(item) || item === Null;

    if (isPrimitiveOrNull(value)) {
        return true;
    } else if (Array.isArray(value) && value.every(isPrimitiveOrNull)) {
        return true;
    } else if (
        Array.isArray(value) &&
        value.length == 1 &&
        Array.isArray(value[0]) &&
        value[0].every(isPrimitiveOrNull)
    ) {
        return true;
    }

    // [todo] not type safe/easy to miss
    const keys = ["equals", "inArray", "inRange"];
    const entries = Object.entries(value);

    return entries.some(
        ([key, value]) =>
            keys.includes(key) && (isPrimitiveOrNull(value) || (Array.isArray(value) && value.every(isPrimitiveOrNull)))
    );
}

function primitiveShapeToClassShape(
    shape: PrimitiveCriteriaShapeType<unknown>,
    factory: IEntityCriteriaFactory
): ICriterionShape<ICriterion, unknown> {
    const isPrimitiveOrNull = (item: unknown): item is Primitive | typeof Null => isPrimitive(item) || item === Null;

    const isStringOrNumber = (item: unknown): item is typeof String | typeof Number =>
        item === String || item === Number;

    if (isPrimitiveOrNull(shape)) {
        return EqualsCriterionShape.create(new EntityCriteriaFactory(), [shape]);
    } else if (Array.isArray(shape) && shape.length == 1 && isPrimitiveOrNull(shape[0])) {
        return InArrayCriterionShape.create([shape[0]], factory);
    } else if (
        Array.isArray(shape) &&
        shape.length == 2 &&
        isStringOrNumber(shape[0]) &&
        isStringOrNumber(shape[1]) &&
        shape[0] === shape[1]
    ) {
        throw new Error(`not yet implemented: RangeCriterionShape.create()`);
    } else if (
        Array.isArray(shape) &&
        shape.length === 1 &&
        Array.isArray(shape[0]) &&
        shape[0].every(isPrimitiveOrNull)
    ) {
        return InArrayCriterionShape.create(shape[0], factory);
    } else if (Array.isArray(shape) && (shape as any[]).every(isPrimitiveOrNull)) {
        return EqualsCriterionShape.create(new EntityCriteriaFactory(), shape);
    }

    // [todo] need to first implement "and" criteria shape, and probably a few criteria math for "and"
    // as well, as I haven't really used/tested it that much
    // // [todo] not type safe/easy to miss
    // const keys = ["equals", "inArray", "inRange"];
    // const entries = Object.entries(jsonShape);

    throw new Error(`invalid/unsupported primitive criteria json shape`);
}

function toCriterionShape(
    // property: IEntitySchemaProperty,
    shape: EntityCriteriaShapePropertyType<unknown>,
    factory: IEntityCriteriaFactory
): ICriterionShape<any, any> {
    // [todo] hastily added this here so that I don't have to provide actual IEntitySchemas
    // in reshaping tests, as I don't make use of any shortcut-primitive shape types there
    if (ICriterionShape.is(shape)) {
        return shape;
    }

    // [todo] handle array types
    // const valueSchema = property.getUnboxedValueSchema();

    if (isPrimitiveCriteriaJsonShape(shape)) {
        return primitiveShapeToClassShape(shape, factory);
    } else {
        return EntityCriteriaShape.create(factory, shape);
    }

    // if (valueSchema.schemaType === "primitive") {
    //     return primitiveShapeToClassShape(shape, factory);
    // } else if (valueSchema.schemaType === "entity") {
    //     return EntityCriteriaShape.create(factory, valueSchema, shape);
    // } else {
    //     throw new Error(`unsupported schema property value type: ${(valueSchema as IEntitySchemaProperty).schemaType}`);
    // }
}

function toInternalShape(
    // schema: IEntitySchema,
    shape: EntityCriteriaShapeType<any>,
    factory: IEntityCriteriaFactory
): EntityCriteriaInternalShapeType {
    let required: EntityCriteriaShapePropertiesType<any>;
    let optional: EntityCriteriaShapePropertiesType<any>;

    if (isRequiredAndOptionalPropertiesType(shape)) {
        required = shape[$required] ?? {};
        optional = shape[$optional] ?? {};
    } else {
        required = shape;
        optional = {};
    }

    // [todo] check if both required & optional are empty, and then decide what to actually do if they are.

    // const properties = keyBy(schema.getProperties(), property => property.getName());
    const requiredInternal: Record<string, ICriterionShape<ICriterion, unknown>> = {};
    const optionalInternal: Record<string, ICriterionShape<ICriterion, unknown>> = {};

    for (const key in required) {
        // [todo] assertion
        // requiredInternal[key] = toCriterionShape(properties[key], required[key]!, factory);
        requiredInternal[key] = toCriterionShape(required[key]!, factory);
    }

    for (const key in optional) {
        // [todo] assertion
        // optionalInternal[key] = toCriterionShape(properties[key], optional[key]!, factory);
        optionalInternal[key] = toCriterionShape(optional[key]!, factory);
    }

    return { [$required]: requiredInternal, [$optional]: optionalInternal };
}

export class EntityCriteriaShape<E extends Entity, S>
    implements ICriterionShape<IEntityCriteria, EntityCriteriaShapeInstance<E, S>>
{
    static create<E extends Entity, S extends EntityCriteriaShapeType<E>>(
        factory: IEntityCriteriaFactory,
        // schema: IEntitySchema<E>,
        shape: S | EntityCriteriaShapeType<E>
    ): EntityCriteriaShape<E, S> {
        return new EntityCriteriaShape({ factory, shape: toInternalShape(shape, factory) });
    }

    constructor({ factory, shape }: { factory: IEntityCriteriaFactory; shape: EntityCriteriaInternalShapeType }) {
        this.factory = factory;
        this.shape = shape;
    }

    readonly [ICriterionShape$] = true;
    private readonly factory: IEntityCriteriaFactory;
    private readonly shape: EntityCriteriaInternalShapeType;

    private getRequiredShapes(): Record<string, ICriterionShape<ICriterion, unknown>> {
        return this.shape[$required];
    }

    private getOptionalShapes(): Record<string, ICriterionShape<ICriterion, unknown>> {
        return this.shape[$optional];
    }

    read(criterion: IEntityCriteria): EntityCriteriaShapeInstance<E, S> {
        throw new Error("Method not implemented.");
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IEntityCriteria> {
        if (IEntityCriteria.is(criterion)) {
            return this.reshapeEntityCriteria(criterion);
        } else if (IOrCriterion.is(criterion)) {
            return reshapeOrCriteria(this, criterion);
        }

        return false;
    }

    // [todo] what happens if the shape has overlapping $required & $optional shapes?
    // example: { [$required]: { bar: { id: Number } }, [$optional]: { bar: { name: String } } }
    private reshapeEntityCriteria(criterion: IEntityCriteria): false | ReshapedCriterion<IEntityCriteria> {
        const criteria = criterion.getCriteria();
        const criteriaToPermutate: Record<string, ICriterion[]> = {};
        const openCriteria: Record<string, ICriterion[]> = {};

        for (const [key, shape] of Object.entries(this.getRequiredShapes())) {
            const criterion = criteria[key];

            if (criterion === void 0) {
                return false;
            }

            const reshaped = shape.reshape(criterion);

            if (reshaped === false) {
                return false;
            }

            criteriaToPermutate[key] = reshaped.getReshaped();

            if (reshaped.getOpen().length) {
                openCriteria[key] = reshaped.getOpen();
            }
        }

        for (const [key, shape] of Object.entries(this.getOptionalShapes())) {
            const criterion = criteria[key];

            if (criterion === void 0) {
                continue;
            }

            const reshaped = shape.reshape(criterion);

            // [todo] interesting that we check against open here. should understand and document the reason
            if (reshaped === false || reshaped.getOpen().length) {
                continue;
            }

            criteriaToPermutate[key] = reshaped.getReshaped();
        }

        if (!Object.keys(criteriaToPermutate).length) {
            return false;
        }

        const reshaped = permutateEntries(criteriaToPermutate).map(criteria => this.factory.where(criteria));

        const open = Object.entries(openCriteria).map(([key, openCriteria]) =>
            this.factory.where({ ...criteria, [key]: this.factory.or(openCriteria) })
        );

        return new ReshapedCriterion(reshaped, open);
    }

    toString(): string {
        return `{ ${[
            ...Object.entries(this.getRequiredShapes()).map(([key, value]) => `${key}: ${value.toString()}`),
            ...Object.entries(this.getOptionalShapes()).map(([key, value]) => `${key}?: ${value.toString()}`),
        ].join(", ")} }`;
    }
}
