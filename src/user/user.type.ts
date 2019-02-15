import { Type, Property } from "../sandbox";

export interface UserType extends Type<"user"> {
    id: Property.Id<"id", typeof Number, "Id">;
    name: Property.Primitive<"name", typeof String, "Name", string, "n">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById", "n">;
    createdBy: Property.Reference<"createdBy", UserType, UserType["createdById"], "CreatedBy", "n">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, UserType["changedById"], "ChangedBy", "n">;
}
