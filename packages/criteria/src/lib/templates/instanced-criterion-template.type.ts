import { ICriterionTemplate } from "./criterion-template.interface";

export type InstancedCriterionTemplate<T> = T extends ICriterionTemplate<infer U> ? U : never;
