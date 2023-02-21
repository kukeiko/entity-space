import { Null, Primitive } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { AllCriterionShape } from "./all/all-criterion-shape";
import { AnyCriterionShape } from "./any-criterion-shape";
import { ICriterionShape } from "./criterion-shape.interface";
import { IEntityCriteriaShapeTools } from "./entity-criteria-shape-tools.interface";
import { IEntityCriteriaTools } from "./entity-criteria-tools.interface";
import { EntityCriteriaShape, EntityCriteriaShapeType } from "./entity-criteria/entity-criteria-shape";
import { EqualsCriterionShape } from "./equals/equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array/in-array-criterion-shape";
import { InRangeCriterionShape } from "./in-range/in-range-criterion-shape";
import { NeverCriterionShape } from "./never/never-criterion-shape";
import { OrCriterionShape } from "./or/or-criterion-shape";

export class EntityCriteriaShapeTools implements IEntityCriteriaShapeTools {
    constructor({ criteriaTools }: { criteriaTools: IEntityCriteriaTools }) {
        this.criteriaTools = criteriaTools;
    }

    private readonly criteriaTools: IEntityCriteriaTools;

    any = (): AnyCriterionShape => {
        return new AnyCriterionShape();
    };

    all = (): AllCriterionShape => {
        return new AllCriterionShape({ tools: this.criteriaTools });
    };

    equals = <T extends Primitive | typeof Null>(valueTypes?: T[] | undefined): EqualsCriterionShape<T> => {
        // [todo] type assertion
        return new EqualsCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            tools: this.criteriaTools,
        });
    };

    inArray = <T extends Primitive | typeof Null>(valueTypes?: T[] | undefined): InArrayCriterionShape<T> => {
        // [todo] type assertion
        return new InArrayCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            tools: this.criteriaTools,
        });
    };

    inRange = <T extends typeof String | typeof Number>(valueType: T): InRangeCriterionShape<T> => {
        return new InRangeCriterionShape({ valueType, tools: this.criteriaTools });
    };

    or = <T extends ICriterionShape>(shapes: T[]): OrCriterionShape<T> => {
        return new OrCriterionShape({ tools: this.criteriaTools, shapes });
    };

    never = (): NeverCriterionShape => new NeverCriterionShape({ tools: this.criteriaTools });

    where = <S extends EntityCriteriaShapeType<Entity>>(shape: S): EntityCriteriaShape<Entity, S> => {
        // [todo] reconsider requiring a schema to create a shape
        return EntityCriteriaShape.create(this.criteriaTools, shape);
    };
}
