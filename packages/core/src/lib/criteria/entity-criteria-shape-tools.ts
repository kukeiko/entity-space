import { isRecord, Null, Primitive, writePath } from "@entity-space/utils";
import { assertValidPaths } from "../common/validate-paths.fn";
import { AllCriterionShape } from "./all/all-criterion-shape";
import { AnyCriterionShape } from "./any-criterion-shape";
import { ICriterionShape } from "./criterion-shape.interface";
import { IEntityCriteriaShapeTools } from "./entity-criteria-shape-tools.interface";
import { IEntityCriteriaTools } from "./entity-criteria-tools.interface";
import { EntityCriteriaShape } from "./entity-criteria/entity-criteria-shape";
import { EqualsCriterionShape } from "./equals/equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array/in-array-criterion-shape";
import { InRangeCriterionShape } from "./in-range/in-range-criterion-shape";
import { NeverCriterionShape } from "./never/never-criterion-shape";
import { OrCriterionShape } from "./or/or-criterion-shape";

// [todo] rename "any" to "anyShape", and apply to all others,
// reason: easier to identify if a shape or a criterion is created when browsing source code
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

    where = (required: Record<string, unknown>, optional?: Record<string, unknown>): EntityCriteriaShape => {
        const map = (bag: Record<string, unknown>): Record<string, ICriterionShape> => {
            const keys = Object.keys(bag);
            
            if (keys.some(key => key.includes("."))) {
                assertValidPaths(keys);
                const writtenPathsBag: Record<string, unknown> = {};

                for (const path of keys) {
                    writePath(path, writtenPathsBag, bag[path]);
                }

                bag = writtenPathsBag;
            }

            const shapes: Record<string, ICriterionShape> = {};

            for (const key in bag) {
                const value = bag[key];

                if (this.isCriterionShape(value)) {
                    shapes[key] = value;
                } else if (isRecord(value)) {
                    shapes[key] = this.where(value);
                } else if (Array.isArray(value) && value.every(isRecord) && value.length === 2) {
                    shapes[key] = this.where(value[0], value[1]);
                } else {
                    throw new Error(`invalid type; neither a criterion shape nor a record for key ${key}`);
                }
            }

            return shapes;
        };

        return new EntityCriteriaShape({
            tools: this.criteriaTools,
            required: map(required),
            optional: optional ? map(optional) : void 0,
        });
    };

    isCriterionShape = (value: unknown): value is ICriterionShape => {
        return ICriterionShape.is(value);
    };
}
