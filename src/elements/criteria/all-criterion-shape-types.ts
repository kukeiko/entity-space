import { AndCriterionShape } from "./and-criterion-shape";
import { EntityCriterionShape } from "./entity-criterion-shape";
import { EqualsCriterionShape } from "./equals-criterion-shape";
import { InArrayCriterionShape } from "./in-array-criterion-shape";
import { InRangeCriterionShape } from "./in-range-criterion-shape";
import { NoneCriterionShape } from "./none-criterion-shape";
import { NotEqualsCriterionShape } from "./not-equals-criterion-shape";
import { NotInArrayCriterionShape } from "./not-in-array-criterion-shape";
import { OrCriterionShape } from "./or-criterion-shape";
import { SomeCriterionShape } from "./some-criterion-shape";

const allCriterionShapeTypes = [
    AndCriterionShape,
    EntityCriterionShape,
    EqualsCriterionShape,
    InArrayCriterionShape,
    InRangeCriterionShape,
    NotEqualsCriterionShape,
    NotInArrayCriterionShape,
    OrCriterionShape,
    SomeCriterionShape,
    NoneCriterionShape,
] as const;

export type AllCriterionShapeTypes = (typeof allCriterionShapeTypes)[number];
