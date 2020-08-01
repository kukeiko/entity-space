import { createProperty } from "src";
import { DataEntryModel } from "../data-entry.model";

export class AuthorModel extends DataEntryModel {
    id = createProperty("id", [Number], b => b.loadable().identifier());
    name = createProperty("name", [String], b => b.loadable(["optional"]));
}
