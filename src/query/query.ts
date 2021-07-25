import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { Criterion } from "../criteria";

export interface Query<T = unknown> {
    criteria: Criterion<T>;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
