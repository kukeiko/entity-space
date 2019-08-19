import { Type, Property } from "@sandbox";
import { SystemMixin } from "./system.mixin";
import { MetadataMixin } from "./metadata.mixin";
import { UserTypeType } from "./user-type.type";

export interface UserType extends Type<"user">, SystemMixin, MetadataMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "userId" | "systemId">;
    userId: Property.Primitive<"userId", typeof Number, "u", "UserId">;
    name: Property.Primitive<"name", typeof String, never, "Name">;

    parentId: Property.Reference.Id.Computed<"parentId", UserType, "id", UserType, "parentUserId" | "systemId">;
    parentUserId: Property.Primitive<"parentUserId", typeof Number, "n", "ParentId">;
    parent: Property.Reference.Virtual<"parent", UserType, UserType["parentId"]>;

    typeId: Property.Reference.Id<"typeId", UserTypeType, "id">;
    type: Property.Reference<"type", UserTypeType, UserType["typeId"]>;

    level: Property.Primitive<"level", typeof Number, never, "Level", typeof String>;
    achievements: Property.Primitive.Array<"achievements", typeof Number, never, "Achievements">;
    randomInts: Property.Primitive.Array<"randomInts", typeof Number, never, "RandomInts", typeof String>;
    languages: Property.Primitive.Array.Deserialized<"languages", typeof String, "n", "Languages", typeof String>;
}
