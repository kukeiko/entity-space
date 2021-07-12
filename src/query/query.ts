import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { EntityCriteria } from "../criteria";

export interface Query<T = unknown> {
    criteria: EntityCriteria<T>;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
