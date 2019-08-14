import { Property } from "@sandbox";
import { SystemType } from "./system.type";

export interface SystemMixin {
    systemId: Property.Reference.Id.Ethereal<"systemId", SystemType, "id">;
    system: Property.Reference.Virtual<"system", SystemType, SystemMixin["systemId"]>;
    /**
     * [todo]
     * mixins should also be able to have computed. currently not possible due to
     * "Type 'SystemMixin' does not satisfy the constraint 'Type<string>'."
     */
    // numDigitsOfSystemId: Property.Primitive.Computed<"numDigitsOfSystemId", typeof Number, SystemMixin, "systemId", "n">;
}
