import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { UserBlueprint } from "./user.model";

@EntityBlueprint({ id: "reviews" })
export class ReviewBlueprint {
    id = define(Number);
    reviewText = define(String, { optional: true });
    createdById = define(Number, { optional: true });
    createdBy = define(UserBlueprint, { optional: true, relation: true, from: "createdById", to: "id" });
}

export type Review = EntityBlueprintInstance<ReviewBlueprint>;
