// cyclic import :(
import { NamedCriteriaBagTemplate } from "../criterion-template.types";

export class NamedCriteriaTemplate<T extends NamedCriteriaBagTemplate = NamedCriteriaBagTemplate> {
    constructor(items: T) {
        this.items = items;
    }

    readonly items: T;
}
