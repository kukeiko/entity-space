import { Class } from "../lang";
import { Property } from "./property";

export interface ObjectTypeMetadata<T = any> {
    class: Class<T>;
    properties: {
        primitives: Property.Primitive[];
        components: Property.Component[];
        references: Property.Reference[];
    };
}
