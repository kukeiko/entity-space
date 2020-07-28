import { Class } from "../utils";
import { Selection } from "../selection";
import { ObjectCriteria } from "../criteria";
import { Reducible } from "./reducible";

export interface Query {
    criteria: ObjectCriteria;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
