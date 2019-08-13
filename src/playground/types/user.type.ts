import { Type, Property } from "@sandbox";
import { SystemMixin } from "./system.mixin";
import { MetadataMixin } from "./metadata.mixin";

export interface UserType extends Type<"user">, SystemMixin, MetadataMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "userId" | "systemId">;
    userId: Property.Primitive<"userId", typeof Number, "u", "UserId">;
    name: Property.Primitive<"name", typeof String, never, "Name">;

    parentId: Property.Reference.Id.Computed<"parentId", UserType, "id", UserType, "parentUserId" | "systemId">;
    parentUserId: Property.Primitive<"parentUserId", typeof Number, "n", "ParentId">;
    parent: Property.Reference.Virtual<"parent", UserType, UserType["parentId"]>;
}
