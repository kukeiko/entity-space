import { ICriterion } from "../criterion.interface";

export const IEntityCriteria$ = Symbol();

export interface IEntityCriteria extends ICriterion {
    readonly [IEntityCriteria$]: true;
    getCriteria(): Record<string, ICriterion>;
    getByPath(path: string[]): ICriterion | undefined;
}
