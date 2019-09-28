import { Property, DomainBuilder } from "@sandbox";

export interface LoadBalancedMixin {
    loadBalancer: Property.Primitive.Ethereal<"loadBalancer", typeof String, "n">;
}

export module LoadBalancedMixin {
    export function getDefinition(): DomainBuilder.DefineArguments.PropertiesOnly<LoadBalancedMixin> {
        return {
            loadBalancer: {
                flags: { n: true },
                primitive: String,
                type: "primitive:ethereal"
            }
        };
    }
}
