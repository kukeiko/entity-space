import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { ObjectCriteria } from "../criteria";

export interface Query<T = unknown> {
    criteria: ObjectCriteria<T>;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
