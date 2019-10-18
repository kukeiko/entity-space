import { PrimitiveProperty } from "./primitive.property";
import { PropertyComponent } from "../component/property.component";
import { IdProperty } from "./id.property";

export type Property<K extends string = string>
    = Property.Id.Any
    | Property.Primitive.Any;
    // = Property.Primitive.Any<string, Property.Primitive.ValueType, any>;

export module Property {
    export import Id = IdProperty;
    export import Primitive = PrimitiveProperty;
}
