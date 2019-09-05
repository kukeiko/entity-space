import { Property, DomainBuilder } from "@sandbox";
import { UserType } from "./user.type";
import { SystemMixin } from "./system.mixin";

export interface MetadataMixin extends SystemMixin {
    createdAt: Property.Primitive<"createdAt", typeof String, never, "CreatedAt">;
    createdById: Property.Reference.Id.Computed<"createdById", UserType, "id", MetadataMixin, "systemId" | "createdByUserId">;
    createdByUserId: Property.Primitive<"createdByUserId", typeof Number, never, "CreatedById">;
    createdBy: Property.Reference.Virtual<"createdBy", UserType, MetadataMixin["createdById"]>;

    changedAt: Property.Primitive<"changedAt", typeof String, "n", "ChangedAt">;
    changedById: Property.Reference.Id.Computed<"changedById", UserType, "id", MetadataMixin, "systemId" | "changedByUserId", "n">;
    changedByUserId: Property.Primitive<"changedByUserId", typeof Number, "n", "ChangedById">;
    changedBy: Property.Reference.Virtual<"changedBy", UserType, MetadataMixin["changedById"], "n">;
}

export module MetadataMixin {
    export function getDefinition(): DomainBuilder.DefineArguments.PropertiesOnly<MetadataMixin> {
        return {
            ...SystemMixin.getDefinition(),
            changedAt: {
                type: "primitive",
                primitive: String,
                dtoKey: "ChangedAt",
                flags: {
                    n: true
                }
            },
            changedBy: {
                flags: {
                    n: true
                }
            },
            changedById: {
                flags: {
                    n: true
                }
            },
            changedByUserId: {
                type: "primitive",
                primitive: Number,
                dtoKey: "ChangedById",
                flags: {
                    n: true
                }
            },
            createdAt: {
                type: "primitive",
                primitive: String,
                dtoKey: "CreatedAt"
            },
            createdBy: {
                flags: {
                    n: true
                }
            },
            createdById: {
                flags: {
                    n: true
                }
            },
            createdByUserId: {
                type: "primitive",
                primitive: Number,
                dtoKey: "CreatedById"
            }
        };
    }
}
