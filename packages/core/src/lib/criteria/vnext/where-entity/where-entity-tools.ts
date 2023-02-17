import {
    isPrimitive,
    isPrimitiveOrNull,
    isPrimitiveOrNullNoCustomArg,
    isPrimitiveValue,
    Null,
    Primitive,
} from "@entity-space/utils";
import { uniq, isPlainObject } from "lodash";
import { Entity } from "../../../common/entity.type";
import { IEntitySchema, IPrimitiveSchema } from "../../../schema/schema.interface";
import { ICriterionShape } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IEntityCriteriaShapeTools } from "../entity-criteria-shape-tools.interface";
import { $optional, $required, EntityCriteriaShape } from "../entity-criteria/entity-criteria-shape";
import { IEntityCriteria } from "../entity-criteria/entity-criteria.interface";
import { WhereEntityShape } from "./where-entity-shape.types";
import {
    WhereEntityArray,
    WhereEntitySingle,
    WhereNumberOrString,
    WherePrimitiveArray,
    WherePrimitiveCommon,
    WherePrimitiveShorthand,
    WherePrimitiveSingle,
} from "./where-entity.types";

const isPrimitiveOrNullType = (item: unknown): item is Primitive | typeof Null => isPrimitive(item) || item === Null;

function isRecord(value: unknown): value is Record<string, unknown> {
    // [todo] potentially not fully correct to use "isPlainObject()" from lodash,
    // as something like "Map" also satisfied the Record<string, unknown> constraint.
    return isPlainObject(value);
}

function isStringOrNumberOrUndefined(value: unknown): value is string | number | undefined {
    return ["string", "number", "undefined"].includes(typeof value);
}

export class WhereEntityTools {
    constructor(
        private readonly shapeFactory: IEntityCriteriaShapeTools,
        private readonly criteriaTools: IEntityCriteriaTools
    ) {}

    // [todo] should potentially be WhereEntitySingleShape instead of WhereEntityShape
    toCriterionShapeFromWhereEntityShape(shape: WhereEntityShape, schema: IEntitySchema): ICriterionShape {
        return this.toEntityCriteriaShapeFromWhereEntityShape(shape);
    }

    private toEntityCriteriaShapeFromWhereEntityShape(shape: WhereEntityShape): EntityCriteriaShape<Entity, unknown> {
        let required: Record<string, ICriterionShape> = {};
        let optional: Record<string, ICriterionShape> = {};

        for (const key in shape) {
            if (key === "$optional") {
                continue;
            }

            const itemShape = this.toPrimitiveCriteriaShapeFromShorthand(shape[key]);

            if (!itemShape) {
                throw new Error(`shape not yet supported: ${JSON.stringify(itemShape)}`);
            }

            required[key] = itemShape;
        }

        const $optional_ = shape.$optional ?? {};

        for (const key in $optional_) {
            const itemShape = this.toPrimitiveCriteriaShapeFromShorthand($optional_[key]);

            if (!itemShape) {
                throw new Error(`shape not yet supported: ${JSON.stringify(itemShape)}`);
            }

            optional[key] = itemShape;
        }

        return new EntityCriteriaShape({
            tools: this.criteriaTools,
            shape: { [$required]: required, [$optional]: optional },
        });
    }

    private toPrimitiveCriteriaShapeFromShorthand(shape: unknown): ICriterionShape | false {
        if (isPrimitiveOrNullType(shape)) {
            return this.shapeFactory.equals([shape]);
        } else if (Array.isArray(shape) && shape.length == 1 && isPrimitiveOrNullType(shape[0])) {
            return this.shapeFactory.inArray([shape[0]]);
        } else if (
            Array.isArray(shape) &&
            shape.length === 1 &&
            Array.isArray(shape[0]) &&
            shape[0].every(isPrimitiveOrNullType)
        ) {
            return this.shapeFactory.inArray(shape[0]);
        } else if (Array.isArray(shape) && (shape as any[]).every(isPrimitiveOrNullType)) {
            return this.shapeFactory.equals(shape);
        }

        return false;
    }

    // [todo] might need schema here
    toWhereEntitySingleFromCriterion(criterion: ICriterion, shape: WhereEntityShape): WhereEntitySingle {
        if (!this.criteriaTools.isEntityCriteria(criterion)) {
            throw new Error(`unexpected type`);
        }

        return this.privateEntityCriterionToPublic(criterion, shape);
    }

    private privateEntityCriterionToPublic(criterion: IEntityCriteria, shape: WhereEntityShape): WhereEntitySingle {
        const criteria = criterion.getCriteria();
        const publicCriterion: WhereEntitySingle = {};

        for (const key in criteria) {
            let criterionShape = shape[key];

            if (criterionShape === void 0) {
                // [todo] this is a very quick hack to make $optional work, can't stay this way.
                criterionShape = (shape.$optional ?? {})[key];

                if (criterionShape === void 0) {
                    continue;
                }
            }

            const shorthandInstance = this.privateCriterionToPublicFromShorthandShape(criteria[key], criterionShape);

            if (shorthandInstance === void 0) {
                throw new Error("not yet implemented; can only map to public criterion for shorthand primitive shapes");
            }

            publicCriterion[key] = shorthandInstance;
        }

        return publicCriterion;
    }

    private privateCriterionToPublicFromShorthandShape(
        criterion: ICriterion,
        shape: unknown
    ): (ReturnType<Primitive | typeof Null> | ReturnType<Primitive | typeof Null>[]) | undefined {
        if (isPrimitiveOrNullType(shape)) {
            if (!this.criteriaTools.isEqualsCriterion(criterion)) {
                throw new Error(`shape error: expected equals criterion`);
            }

            return criterion.getValue();
        } else if (Array.isArray(shape) && shape.length == 1 && isPrimitiveOrNullType(shape[0])) {
            if (!this.criteriaTools.isInArrayCriterion(criterion)) {
                throw new Error(`shape error: expected in-array criterion`);
            }

            return criterion.getValues();
        } else if (
            Array.isArray(shape) &&
            shape.length === 1 &&
            Array.isArray(shape[0]) &&
            shape[0].every(isPrimitiveOrNullType)
        ) {
            if (!this.criteriaTools.isInArrayCriterion(criterion)) {
                throw new Error(`shape error: expected in-array criterion`);
            }

            return criterion.getValues();
        } else if (Array.isArray(shape) && (shape as any[]).every(isPrimitiveOrNullType)) {
            if (!this.criteriaTools.isEqualsCriterion(criterion)) {
                throw new Error(`shape error: expected equals criterion`);
            }

            return criterion.getValue();
        }

        return void 0;
    }

    toCriterionFromWhereEntitySingle(schema: IEntitySchema, where: WhereEntitySingle): ICriterion {
        const propertyCriteria: Record<string, ICriterion> = {};

        for (const key in where) {
            if (key.startsWith("$")) {
                continue;
            }

            const value = where[key];
            const property = schema.getProperty(key);
            const valueSchema = property.getValueSchema();
            const unboxedValueSchema = property.getUnboxedValueSchema();
            let propertyCriterion: ICriterion;

            if (unboxedValueSchema.isPrimitive()) {
                if (valueSchema.isArray()) {
                    propertyCriterion = this.toCriterionFromWherePrimitiveArray(unboxedValueSchema, value);
                } else {
                    propertyCriterion = this.toCriterionFromWherePrimitiveSingle(unboxedValueSchema, value);
                }
            } else if (unboxedValueSchema.isEntity()) {
                if (valueSchema.isArray()) {
                    propertyCriterion = this.toCriterionFromWhereEntityArray(unboxedValueSchema, value);
                } else {
                    propertyCriterion = this.toCriterionFromWhereEntitySingle(unboxedValueSchema, value);
                }
            } else {
                throw new Error(`unsupported value schema`);
            }

            propertyCriteria[key] = propertyCriterion;
        }

        // [todo] $and/$or missing
        const and: ICriterion[] = [];
        const or: ICriterion[] = [];

        if (where.$and) {
            and.push(...where.$and.map(where => this.toCriterionFromWhereEntitySingle(schema, where)));
        }

        if (where.$or) {
            or.push(...where.$or.map(where => this.toCriterionFromWhereEntitySingle(schema, where)));
        }

        return this.criteriaTools.and(
            this.criteriaTools.where(propertyCriteria),
            this.criteriaTools.and(and),
            this.criteriaTools.or(or)
        );
    }

    toCriterionFromWhereEntityArray(schema: IEntitySchema, where: WhereEntityArray<Entity>): ICriterion {
        const propertyCriteria: Record<string, ICriterion> = {};

        for (const key in where) {
            if (key.startsWith("$")) {
                continue;
            }

            const value = where[key];
            const property = schema.getProperty(key);
            const valueSchema = property.getValueSchema();
            const unboxedValueSchema = property.getUnboxedValueSchema();
            let propertyCriterion: ICriterion;

            if (unboxedValueSchema.isPrimitive()) {
                if (valueSchema.isArray()) {
                    propertyCriterion = this.toCriterionFromWherePrimitiveArray(unboxedValueSchema, value);
                } else {
                    propertyCriterion = this.toCriterionFromWherePrimitiveSingle(unboxedValueSchema, value);
                }
            } else if (unboxedValueSchema.isEntity()) {
                if (valueSchema.isArray()) {
                    propertyCriterion = this.toCriterionFromWhereEntityArray(unboxedValueSchema, value);
                } else {
                    propertyCriterion = this.toCriterionFromWhereEntitySingle(unboxedValueSchema, value);
                }
            } else {
                throw new Error(`unsupported value schema`);
            }

            propertyCriteria[key] = propertyCriterion;
        }

        const and: ICriterion[] = [];
        const or: ICriterion[] = [];

        if (where.$and) {
            and.push(...where.$and.map(where => this.toCriterionFromWhereEntityArray(schema, where)));
        }

        if (where.$or) {
            or.push(...where.$or.map(where => this.toCriterionFromWhereEntityArray(schema, where)));
        }

        if (where.$some) {
            and.push(this.criteriaTools.some(this.toCriterionFromWhereEntitySingle(schema, where.$some)));
        }

        if (where.$every) {
            and.push(this.criteriaTools.every(this.toCriterionFromWhereEntitySingle(schema, where.$every)));
        }

        return this.criteriaTools.and(
            this.criteriaTools.some(this.criteriaTools.where(propertyCriteria)),
            this.criteriaTools.and(and),
            this.criteriaTools.or(or)
        );
    }

    looksLikeWherePrimitiveShorthand(where: WherePrimitiveShorthand<unknown>): boolean {
        return isPrimitiveOrNull(where) || (Array.isArray(where) && where.every(isPrimitiveOrNullNoCustomArg));
    }

    toCriterionFromWherePrimitiveShorthand(
        schema: IPrimitiveSchema,
        where: WherePrimitiveShorthand<unknown>
    ): ICriterion {
        if (where === null) {
            if (!schema.isNullable()) {
                throw new Error(`schema is not nullable`);
            }

            return this.criteriaTools.equals(null);
        } else if (Array.isArray(where)) {
            const unsupportedValueTypes = uniq(
                where.filter(value => !schema.supportsValue(value)).map(value => typeof value)
            );

            if (unsupportedValueTypes.length) {
                throw new Error(`schema doesn't support value type(s): ${unsupportedValueTypes.join(", ")}`);
            }

            // [todo] where is any[] due to Array.isArray(), which is why there is no error as .inArray()
            // expects iterable of primitives
            return this.criteriaTools.inArray(where);
        } else if (isPrimitiveValue(where)) {
            if (!schema.supportsValue(where)) {
                throw new Error(`schema doesn't support value type: ${typeof where}`);
            }

            return this.criteriaTools.equals(where);
        } else {
            throw new Error(`not a primitive shorthand: ${where}`);
        }
    }

    toCriterionFromWhereNumberOrString(schema: IPrimitiveSchema, key: string, value: unknown): ICriterion {
        switch (key as keyof WhereNumberOrString<String | Number>) {
            case "$range":
            case "$between": {
                if (Array.isArray(value) && value.length === 2 && value.every(isStringOrNumberOrUndefined)) {
                    const unsupportedValueTypes = uniq(
                        value.filter(value => !schema.supportsValue(value)).map(value => typeof value)
                    );

                    if (unsupportedValueTypes.length) {
                        throw new Error(`schema doesn't support value type(s): ${unsupportedValueTypes.join(", ")}`);
                    }

                    return this.criteriaTools.inRange(value[0], value[1], key === "$range");
                } else {
                    throw new Error(`invalid argument for ${key}: ${value}`);
                }
            }

            case "$greater":
            case "$greaterEquals": {
                if (!schema.supportsValue(value)) {
                    throw new Error(`schema doesn't support value type: ${typeof value}`);
                } else if (!isPrimitiveOrNull(value, [String, Number])) {
                    throw new Error(`invalid argument for ${key}: ${value}`);
                }

                return this.criteriaTools.inRange(value, void 0, key === "$greaterEquals");
            }

            case "$lesser":
            case "$lesserEquals": {
                if (!schema.supportsValue(value)) {
                    throw new Error(`schema doesn't support value type: ${typeof value}`);
                } else if (!isPrimitiveOrNull(value, [String, Number])) {
                    throw new Error(`invalid argument for ${key}: ${value}`);
                }

                return this.criteriaTools.inRange(void 0, value, key === "$lesserEquals");
            }
            default:
                throw new Error(`key not supported in WhereNumberOrString: ${key}`);
        }
    }

    isKeyOfWhereNumberOrString(key: string): key is keyof WhereNumberOrString<Number | String> {
        const keys: Record<keyof WhereNumberOrString<Number | String>, true> = {
            $between: true,
            $greater: true,
            $greaterEquals: true,
            $lesser: true,
            $lesserEquals: true,
            $range: true,
        };

        return (keys as Record<string, true>)[key] === true;
    }

    toCriterionFromWherePrimitiveSingle(schema: IPrimitiveSchema, where: WherePrimitiveSingle<unknown>): ICriterion {
        if (this.looksLikeWherePrimitiveShorthand(where)) {
            return this.toCriterionFromWherePrimitiveShorthand(schema, where);
        } else if (isRecord(where)) {
            const and: ICriterion[] = [];
            const or: ICriterion[] = [];
            const schemaSupportsNumberOrString = schema.supportsValue("") || schema.supportsValue(0);

            for (const key in where) {
                if (!key.startsWith("$")) {
                    throw new Error(`key not supported in where-primitive: ${key}`);
                } else if ((key as keyof WherePrimitiveCommon<unknown>) === "$equals") {
                    and.push(this.toCriterionFromWherePrimitiveShorthand(schema, where[key]));
                } else if (this.isKeyOfWhereNumberOrString(key)) {
                    if (!schemaSupportsNumberOrString) {
                        throw new Error(`schema doesn't support number or string`);
                    }

                    and.push(this.toCriterionFromWhereNumberOrString(schema, key, where[key]));
                } else if (key === "$and" || key === "$or") {
                    // [todo] no "as keyof ..." possible yet, as there is no dedicated type for the $and & $or properties
                    const values = where[key];

                    if (!Array.isArray(values)) {
                        throw new Error(`expected value to be an array, key: ${key}`);
                    } else {
                        (key === "$and" ? and : or).push(
                            ...values.map(value => this.toCriterionFromWherePrimitiveSingle(schema, value))
                        );
                    }
                } else {
                    throw new Error(`key not supported in where-primitive: ${key}`);
                }
            }

            return this.criteriaTools.and(this.criteriaTools.and(and), this.criteriaTools.or(or));
        } else {
            throw new Error(`schema doesn't support value type: ${typeof where}`);
        }
    }

    toCriterionFromWherePrimitiveArray(schema: IPrimitiveSchema, where: WherePrimitiveArray<unknown>): ICriterion {
        if (this.looksLikeWherePrimitiveShorthand(where)) {
            return this.criteriaTools.some(this.toCriterionFromWherePrimitiveShorthand(schema, where));
        } else if (isRecord(where)) {
            const someAnd: ICriterion[] = [];
            const and: ICriterion[] = [];
            const or: ICriterion[] = [];
            const schemaSupportsNumberOrString = schema.supportsValue("") || schema.supportsValue(0);

            for (const key in where) {
                if (!key.startsWith("$")) {
                    throw new Error(`key not supported in WherePrimitiveArray: ${key}`);
                } else if ((key as keyof WherePrimitiveCommon<unknown>) === "$equals") {
                    someAnd.push(this.toCriterionFromWherePrimitiveShorthand(schema, where[key]));
                } else if (this.isKeyOfWhereNumberOrString(key)) {
                    if (!schemaSupportsNumberOrString) {
                        throw new Error(`schema doesn't support number or string`);
                    }

                    someAnd.push(this.toCriterionFromWhereNumberOrString(schema, key, where[key]));
                } else if (key === "$and" || key === "$or") {
                    // [todo] no "as keyof ..." possible yet, as there is no dedicated type for the $and & $or properties
                    const values = where[key];

                    if (!Array.isArray(values)) {
                        throw new Error(`expected value to be an array, key: ${key}`);
                    } else {
                        (key === "$and" ? and : or).push(
                            ...values.map(value => this.toCriterionFromWherePrimitiveArray(schema, value))
                        );
                    }
                } else if (key === "$some" || key === "$every") {
                    // [todo] no "as keyof ..." possible yet, as there is no dedicated type for the $some & $every properties
                    if (key === "$some") {
                        and.push(this.criteriaTools.some(this.toCriterionFromWherePrimitiveSingle(schema, where[key])));
                    } else {
                        and.push(this.criteriaTools.every(this.toCriterionFromWherePrimitiveArray(schema, where[key])));
                    }
                } else {
                    throw new Error(`key not supported in WherePrimitiveArray: ${key}`);
                }
            }

            return this.criteriaTools.and(
                this.criteriaTools.some(this.criteriaTools.and(someAnd)),
                this.criteriaTools.and(and),
                this.criteriaTools.or(or)
            );
        } else {
            throw new Error(`schema doesn't support value type: ${typeof where}`);
        }
    }
}
