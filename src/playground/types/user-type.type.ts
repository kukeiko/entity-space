import { Type, Property, DomainBuilder } from "@sandbox";
import { MetadataMixin } from "./metadata.mixin";

export interface UserTypeType extends Type<"user-type">, MetadataMixin {
    id: Property.Id<"id", typeof Number, "Id">;
    name: Property.Primitive<"name", typeof String, never, "Name">;
}

export module UserTypeType {
    export function getDefinition(): DomainBuilder.DefineArguments<UserTypeType> {
        return {
            $: {
                key: "user-type"
            },
            ...MetadataMixin.getDefinition(),
            id: {
                dtoKey: "Id",
                primitive: Number,
                type: "id"
            },
            name: {
                dtoKey: "Name",
                primitive: String,
                type: "primitive"
            }
        };
    }
}
