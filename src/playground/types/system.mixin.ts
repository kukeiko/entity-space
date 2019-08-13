import { Property } from "@sandbox";
import { SystemType } from "./system.type";

export interface SystemMixin {
    systemId: Property.Reference.Id.Ethereal<"systemId", SystemType, "id">;
    system: Property.Reference.Virtual<"system", SystemType, SystemMixin["systemId"]>;
}
