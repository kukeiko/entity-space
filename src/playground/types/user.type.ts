import { Type, Property } from "@sandbox";
import { SystemMixin } from "./system.mixin";
import { MetadataMixin } from "./metadata.mixin";

export interface UserType extends Type<"user">, SystemMixin, MetadataMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "systemId" | "userId">;
    userId: Property.Primitive<"userId", typeof Number, "u", "UserId">;
    name: Property.Primitive<"name", typeof String, never, "Name">;
}
