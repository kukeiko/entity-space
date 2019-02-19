import { Type, Property } from "../../sandbox";
import { SystemMixin } from "./system.mixin";

export interface UserType extends Type<"user">, SystemMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "systemId" | "userId">;
    userId: Property.Primitive<"userId", typeof Number, "UserId", number, "u">;
    name: Property.Primitive<"name", typeof String, "Name">;
}

export interface UserMetadataMixin {
    createdAt: Property.Primitive<"createdAt", typeof String, "CreatedAt">;
    createdById: Property.Reference.Id.Computed<"createdById", UserType, "id", UserMetadataMixin, "createdBySystemId" | "createdByUserId">;
    createdByUserId: Property.Primitive<"createdByUserId", typeof Number, "CreatedById">;
    createdBySystemId: Property.Primitive.Ethereal<"createdBySystemId", typeof Number>;
    createdBy: Property.Reference.Virtual<"createdBy", UserType, UserMetadataMixin["createdById"]>;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt", string, "n">;
    changedById: Property.Reference.Id.Computed<"changedById", UserType, "id", UserMetadataMixin, "changedBySystemId" | "changedByUserId", "n">;
    changedBySystemId: Property.Primitive.Ethereal<"changedBySystemId", typeof Number, "n">;
    changedByUserId: Property.Primitive<"changedByUserId", typeof Number, "ChangedById", number, "n">;
    changedBy: Property.Reference.Virtual<"changedBy", UserType, UserMetadataMixin["changedById"], "n">;
}
