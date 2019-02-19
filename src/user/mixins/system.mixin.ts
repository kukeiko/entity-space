import { Property, Type } from "../../sandbox";

export interface SystemType extends Type<"system"> {
    id: Property.Id<"id", typeof Number>;
    name: Property.Primitive<"name", typeof String>;
}

export interface SystemMixin {
    systemId: Property.Reference.Id.Ethereal<"systemId", SystemType, "id">;
    system: Property.Reference.Virtual<"system", SystemType, SystemMixin["systemId"]>;
}
