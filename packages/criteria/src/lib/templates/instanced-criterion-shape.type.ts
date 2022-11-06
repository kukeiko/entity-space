import { ICriterionShape } from "./criterion-shape.interface";

export type InstancedCriterionShape<T> = T extends ICriterionShape<infer U> ? U : never;
