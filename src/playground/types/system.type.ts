import { Type, Property } from "@sandbox";

export interface SystemType extends Type<"system"> {
    id: Property.Id<"id", typeof Number>;
    name: Property.Primitive<"name", typeof String>;
}
