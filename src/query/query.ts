import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { ValueCriterion } from "../criteria";

export interface Query<T = unknown> {
    criteria: ValueCriterion<T>;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
