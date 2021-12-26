import { define } from "@entity-space/core";
import { DataEntryModel } from "./data-entry.model";

export class AuthorModel extends DataEntryModel {
    id = define(Number, { id: true, required: true });
    name = define(String);
}
