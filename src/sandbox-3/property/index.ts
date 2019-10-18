import { PrimitiveProperty } from "./primitive.property";
import { PropertyComponent } from "../component/property.component";
import { IdProperty } from "./id.property";
import { ReferenceProperty } from "./reference.property";
import { StringProperty } from "./string.property";
import { NumberProperty } from "./number.property";

export type Property<K extends string = string>
    = Property.Id.Any
    | Property.Number.Any
    | Property.Primitive.Any
    | Property.Reference.Any
    | Property.String.Any
    ;
// = Property.Primitive.Any<string, Property.Primitive.ValueType, any>;

export module Property {
    export import Id = IdProperty;
    export import Primitive = PrimitiveProperty;
    export import Reference = ReferenceProperty;
    export import Number = NumberProperty;
    export import String = StringProperty;
}
