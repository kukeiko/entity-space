import { Class } from "../lang";
import { Property } from "./property";
import { ObjectTypeMetadata } from "./object-type-metadata";

export interface EntityTypeMetadata<T = any> extends ObjectTypeMetadata<T> {
    properties: ObjectTypeMetadata<T>["properties"] & {
        id: Property.Id;
        children: Property.Child[];
    };
}
