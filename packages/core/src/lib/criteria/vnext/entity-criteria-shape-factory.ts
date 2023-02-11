import { Null, Primitive } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { AllCriterionShape } from "./all/all-criterion-shape";
import { AnyCriterionShape } from "./any-criterion-shape";
import { ICriterionShape } from "./criterion-shape.interface";
import { ICriterion } from "./criterion.interface";
import { IEntityCriteriaFactory } from "./entity-criteria-factory.interface";
import { IEntityCriteriaShapeFactory } from "./entity-criteria-shape-factory.interface";
import { EntityCriteriaShape, EntityCriteriaShapeType } from "./entity-criteria/entity-criteria-shape";
import { EqualsCriterionShape } from "./equals/equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array/in-array-criterion-shape";
import { InRangeCriterionShape } from "./in-range/in-range-criterion-shape";
import { NeverCriterionShape } from "./never/never-criterion-shape";
import { OrCriterionShape } from "./or/or-criterion-shape";

export class EntityCriteriaShapeFactory implements IEntityCriteriaShapeFactory {
    constructor({ criteriaFactory }: { criteriaFactory: IEntityCriteriaFactory }) {
        this.criteriaFactory = criteriaFactory;
    }

    private readonly criteriaFactory: IEntityCriteriaFactory;

    any = (): AnyCriterionShape => {
        return new AnyCriterionShape();
    };

    all = (): AllCriterionShape => {
        return new AllCriterionShape();
    };

    equals = <T extends Primitive | typeof Null>(valueTypes?: T[] | undefined): EqualsCriterionShape<T> => {
        // [todo] type assertion
        return new EqualsCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            factory: this.criteriaFactory,
        });
    };

    inArray = <T extends Primitive | typeof Null>(valueTypes?: T[] | undefined): InArrayCriterionShape<T> => {
        // [todo] type assertion
        return new InArrayCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            factory: this.criteriaFactory,
        });
    };

    inRange = <T extends typeof String | typeof Number>(valueType: T): InRangeCriterionShape<T> => {
        return new InRangeCriterionShape({ valueType });
    };

    or = <T extends ICriterionShape<ICriterion, unknown>>(shapes: T[]): OrCriterionShape<T> => {
        return new OrCriterionShape({ factory: this.criteriaFactory, shapes });
    };

    never = (): NeverCriterionShape => new NeverCriterionShape();

    where = <S extends EntityCriteriaShapeType<Entity>>(shape: S): EntityCriteriaShape<Entity, S> => {
        // [todo] reconsider requiring a schema to create a shape
        return EntityCriteriaShape.create(this.criteriaFactory, shape);
    };
}
