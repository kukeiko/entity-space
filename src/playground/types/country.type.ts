import { Type, Property } from "@sandbox";
import { MetadataMixin } from "./metadata.mixin";

export interface CountryType extends Type<"country">, MetadataMixin {
    id: Property.Id<"id", typeof String, "Id">;
    name: Property.Primitive<"name", typeof String, never, "Name">;
    population: Property.Primitive<"population", typeof Number, never, "Population">;
    languages: Property.Primitive.Array.Deserialized<"languages", typeof String, never, "Languages">;
}
