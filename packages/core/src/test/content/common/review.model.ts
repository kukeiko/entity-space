import { BlueprintInstance, define } from "@entity-space/common";
import { UserBlueprint } from "./user.model";

export class ReviewBlueprint {
    id = define(Number, { required: true });
    reviewText = define(String);
    createdById = define(Number);
    createdBy = define(UserBlueprint, { relation: true, from: "createdById", to: "id" });
}

export type Review = BlueprintInstance<ReviewBlueprint>;
