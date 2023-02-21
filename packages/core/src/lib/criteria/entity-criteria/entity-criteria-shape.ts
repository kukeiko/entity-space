import { permutateEntries, Unbox } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IEntityCriteria } from "./entity-criteria.interface";

type EntityCriteriaShapePropertyType<T> = ICriterionShape | EntityCriteriaShapeType<T>;

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

export type EntityCriteriaInternalShapeType = {
    [$required]: Record<string, ICriterionShape>;
    [$optional]: Record<string, ICriterionShape>;
};

function toCriterionShape(
    // property: IEntitySchemaProperty,
    shape: EntityCriteriaShapePropertyType<unknown>,
    factory: IEntityCriteriaTools
): ICriterionShape {
    // [todo] hastily added this here so that I don't have to provide actual IEntitySchemas
    // in reshaping tests, as I don't make use of any shortcut-primitive shape types there
    if (ICriterionShape.is(shape)) {
        return shape;
    }

    return EntityCriteriaShape.create(factory, shape);
}

function toInternalShape(
    // schema: IEntitySchema,
    shape: EntityCriteriaShapeType<any>,
    factory: IEntityCriteriaTools
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
    const requiredInternal: Record<string, ICriterionShape> = {};
    const optionalInternal: Record<string, ICriterionShape> = {};

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

export class EntityCriteriaShape<E extends Entity, S> implements ICriterionShape<IEntityCriteria> {
    static create<E extends Entity, S extends EntityCriteriaShapeType<E>>(
        tools: IEntityCriteriaTools,
        // schema: IEntitySchema<E>,
        shape: S | EntityCriteriaShapeType<E>
    ): EntityCriteriaShape<E, S> {
        return new EntityCriteriaShape({ tools, shape: toInternalShape(shape, tools) });
    }

    constructor({ tools, shape }: { tools: IEntityCriteriaTools; shape: EntityCriteriaInternalShapeType }) {
        this.tools = tools;
        this.shape = shape;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly shape: EntityCriteriaInternalShapeType;

    private getRequiredShapes(): Record<string, ICriterionShape> {
        return this.shape[$required];
    }

    private getOptionalShapes(): Record<string, ICriterionShape> {
        return this.shape[$optional];
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IEntityCriteria> {
        if (this.tools.isEntityCriteria(criterion)) {
            return this.reshapeEntityCriteria(criterion);
        } else if (this.tools.isOrCriterion(criterion)) {
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

        const reshaped = permutateEntries(criteriaToPermutate).map(criteria => this.tools.where(criteria));

        const open = Object.entries(openCriteria).map(([key, openCriteria]) =>
            this.tools.where({ ...criteria, [key]: this.tools.or(openCriteria) })
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
