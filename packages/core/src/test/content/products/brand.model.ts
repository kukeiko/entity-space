import { BlueprintInstance, define } from "@entity-space/common";

export class BrandBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String);
}

export type Brand = BlueprintInstance<BrandBlueprint>;
