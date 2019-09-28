import { Type, Property, DomainBuilder } from "@sandbox";

export interface KeyValuePairType extends Type<"key-value-pair"> {
    key: Property.Primitive<"key", typeof String, never, "Key">;
    value: Property.Primitive<"value", typeof String, never, "Value">;
}

export module KeyValuePairType {
    export function getDefinition() : DomainBuilder.DefineArguments<KeyValuePairType> {
        return {
            $: {
                key: "key-value-pair"
            },
            key: {
                dtoKey: "Key",
                primitive: String,
                type: "primitive"
            },
            value: {
                dtoKey: "Value",
                primitive: String,
                type: "primitive"
            }
        };
    }
}
