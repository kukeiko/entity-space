import { CriterionTemplate } from "../criterion-template.types";

export class AndCriteriaTemplate<T extends CriterionTemplate[] = CriterionTemplate[]> {
    constructor(items: T) {
        this.items = items;
    }

    readonly items: T;
    // [todo] get rid of this hack
    readonly combinator: "&" = "&"; // otherwise typeof OrCriteriaTemplate === typeof AndCriteriaTemplate
}