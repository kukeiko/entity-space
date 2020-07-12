import { ValueType } from "./value-type";

export type Property = Property.Id | Property.Primitive | Property.Component | Property.Reference | Property.Child;

export module Property {
    /**
     * A unique identifier of an entity.
     */
    export interface Id {
        name: string;
        type: "id";
        valueType: ValueType.Number | ValueType.String | ValueType.Uuid;
    }

    /**
     * A primitive value; i.e. anything that is copied by value rather than by reference.
     */
    export interface Primitive {
        iterable: boolean;
        name: string;
        type: "primitive";
        valueType: ValueType.Boolean | ValueType.Date | ValueType.Number | ValueType.Set | ValueType.String | ValueType.Uuid;
    }

    /**
     * An reference to another entity.
     */
    export interface Reference {
        iterable: boolean;
        name: string;
        type: "reference";
        valueType: ValueType.Entity;
    }

    /**
     * A reference to another entity that is a child.
     */
    export interface Child {
        iterable: boolean;
        name: string;
        type: "child";
        valueType: ValueType.Entity;
    }

    /**
     * An object without an id, and as such can not be separated away from the object that contains it.
     */
    export interface Component {
        iterable: boolean;
        name: string;
        type: "component";
        valueType: ValueType.Object;
    }
}
