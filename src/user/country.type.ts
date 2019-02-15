import { Type, Property } from "../sandbox";
import { UserType } from "./user.type";

export interface CountryType extends Type<"country"> {
    id: Property.Id<"id", typeof String>;
    name: Property.Primitive<"name", typeof String, "Name">;
    population: Property.Primitive<"population", typeof Number, "Population">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Property.Reference<"createdBy", UserType, CountryType["createdById"], "CreatedBy">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, CountryType["changedById"], "ChangedBy", "n">;
}
