import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { UserBlueprint } from "./user.model";

@EntityBlueprint({ id: "reviews" })
export class ReviewBlueprint {
    id = define(Number, { required: true });
    reviewText = define(String);
    createdById = define(Number);
    createdBy = define(UserBlueprint, { relation: true, from: "createdById", to: "id" });
}

export type Review = EntityBlueprintInstance<ReviewBlueprint>;
