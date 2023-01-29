import { BlueprintInstance } from "../../../lib/common/schema/blueprint-instance";
import { define } from "../../../lib/common/schema/blueprint-property";

export class BrandBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String);
}

export type Brand = BlueprintInstance<BrandBlueprint>;
