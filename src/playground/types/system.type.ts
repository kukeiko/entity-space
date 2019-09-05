import { Type, Property, DomainBuilder } from "@sandbox";

export interface SystemType extends Type<"system"> {
    id: Property.Id<"id", typeof Number, "Id", typeof String>;
    name: Property.Primitive<"name", typeof String>;
}

export module SystemType {
    export function getDefinition(): DomainBuilder.DefineArguments<SystemType> {
        return {
            $: {
                key: "system"
            },
            id: {
                type: "id",
                primitive: Number,
                dtoKey: "Id",
                fromDto: x => parseInt(x),
                toDto: x => x.toString()
            },
            name: {
                type: "primitive",
                primitive: String
            }
        };
    }
}
