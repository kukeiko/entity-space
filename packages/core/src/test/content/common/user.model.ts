import { Blueprint, BlueprintInstance, define } from "@entity-space/core";

@Blueprint({ id: "users" })
export class UserBlueprint {
    id = define(Number, { id: true, required: true, readOnly: true });
    name = define(String);
}

export type User = BlueprintInstance<UserBlueprint>;
