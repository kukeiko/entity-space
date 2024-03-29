import { Null, Primitive } from "@entity-space/utils";
import { AllCriterionShape } from "./all/all-criterion-shape";
import { AnyCriterionShape } from "./any-criterion-shape";
import { ICriterionShape } from "./criterion-shape.interface";
import { EntityCriteriaShape } from "./entity-criteria/entity-criteria-shape";
import { EqualsCriterionShape } from "./equals/equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array/in-array-criterion-shape";
import { InRangeCriterionShape } from "./in-range/in-range-criterion-shape";
import { NeverCriterionShape } from "./never/never-criterion-shape";
import { OrCriterionShape } from "./or/or-criterion-shape";

export interface IEntityCriteriaShapeTools {
    toDestructurable(): IEntityCriteriaShapeTools;
    any(): AnyCriterionShape;
    all(): AllCriterionShape;
    equals<T extends Primitive | typeof Null>(valueTypes?: T[]): EqualsCriterionShape<T>;
    inArray<T extends Primitive | typeof Null>(valueTypes?: T[]): InArrayCriterionShape<T>;
    inRange<T extends typeof String | typeof Number>(valueType: T): InRangeCriterionShape<T>;
    or<T extends ICriterionShape>(shapes: T[]): OrCriterionShape<T>;
    never(): NeverCriterionShape;
    where(required: Record<string, unknown>, optional?: Record<string, unknown>): EntityCriteriaShape;
}
