import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { ReviewBlueprint } from "./review.model";

@EntityBlueprint({ id: "users" })
export class UserBlueprint {
    id = define(Number, { id: true, required: true, readOnly: true, index: true });
    name = define(String);
    // [todo] expected parentId = define([Number, Null]) to work as well
    // figure out which one is more obvious for the user (probably the nullable attribute)
    parentId = define(Number, { nullable: true, index: true });
    parent = define(UserBlueprint, { relation: true, from: "parentId", to: "id" });
    children = define(UserBlueprint, { array: true });
    reviews = define(ReviewBlueprint, { array: true, relation: true, from: "id", to: "createdById" });
}

export type User = EntityBlueprintInstance<UserBlueprint>;
