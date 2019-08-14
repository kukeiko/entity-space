import { Property } from "@sandbox";
import { UserType } from "./user.type";

export interface MetadataMixin {
    createdAt: Property.Primitive<"createdAt", typeof String, never, "CreatedAt">;
    createdById: Property.Reference.Id.Computed<"createdById", UserType, "id", MetadataMixin, "createdBySystemId" | "createdByUserId">;
    createdByUserId: Property.Primitive<"createdByUserId", typeof Number, never, "CreatedById">;
    createdBySystemId: Property.Primitive.Ethereal<"createdBySystemId", typeof Number>;
    createdBy: Property.Reference.Virtual<"createdBy", UserType, MetadataMixin["createdById"]>;

    changedAt: Property.Primitive<"changedAt", typeof String, "n", "ChangedAt">;
    changedById: Property.Reference.Id.Computed<"changedById", UserType, "id", MetadataMixin, "changedBySystemId" | "changedByUserId", "n">;
    changedBySystemId: Property.Primitive.Ethereal<"changedBySystemId", typeof Number, "n">;
    changedByUserId: Property.Primitive<"changedByUserId", typeof Number, "n", "ChangedById">;
    changedBy: Property.Reference.Virtual<"changedBy", UserType, MetadataMixin["changedById"], "n">;
}
