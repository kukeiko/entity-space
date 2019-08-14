import { Type, Property } from "@sandbox";
import { SystemMixin } from "./system.mixin";
import { MetadataMixin } from "./metadata.mixin";

export interface UserTypeType extends Type<"user-type">, SystemMixin, MetadataMixin {
    id: Property.Id<"id", typeof Number, "Id">;
    name: Property.Primitive<"name", typeof String, never, "Name">;
}
