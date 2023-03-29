import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";

export class BrandBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String);
}

export type Brand = EntityBlueprintInstance<BrandBlueprint>;
