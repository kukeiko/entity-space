import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { Criteria } from "../criteria";

export interface Query<T = unknown> {
    criteria: Criteria<T>;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
