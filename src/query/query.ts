import { Class } from "../utils";
import { Selection } from "../selection";
import { Criteria } from "../criteria";
import { Reducible } from "./reducible";

export interface Query {
    criteria: Criteria;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
