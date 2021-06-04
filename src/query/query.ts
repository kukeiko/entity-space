import { Class } from "../utils";
import { Selection } from "../selection";
import { Reducible } from "./reducible";
import { ObjectCriteria } from "../criteria/value-criterion/_new-stuff/object-criteria";

export interface Query {
    criteria: ObjectCriteria;
    model: Class[];
    options: Reducible;
    selection: Selection;
}
