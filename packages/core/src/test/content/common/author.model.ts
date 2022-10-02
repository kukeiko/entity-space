import { Blueprint, BlueprintInstance, define } from "@entity-space/core";
import { DataEntryBlueprint } from "./data-entry.model";

@Blueprint({ id: "authors" })
export class AuthorBlueprint extends DataEntryBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String);
}

export type Author = BlueprintInstance<AuthorBlueprint>;
