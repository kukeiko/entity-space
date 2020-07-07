import { Class } from "../lang";

export type ValueType = ValueType.Boolean | ValueType.Date | ValueType.Number | ValueType.Set | ValueType.String | ValueType.Uuid | ValueType.Object;

export module ValueType {
    export interface Boolean {
        type: "boolean";
    }

    /**
     * A string that conforms to a date format.
     */
    export interface Date {
        format: "date" | "date-time";
        type: "date";
    }

    /**
     * A double, a float, an int32 or an int64.
     */
    export interface Number {
        format: "double" | "float" | "int32" | "int64";
        type: "number";
    }

    /**
     * A collection of unique primitives.
     */
    export interface Set {
        members: (boolean | number | string)[];
        type: "set";
    }

    /**
     * A string.
     */
    export interface String {
        type: "string";
    }

    /**
     * A uuid v4 conform globally unique identifier.
     *
     * [todo] make sure we really want to use v4. i forgot which one is most common.
     */
    export interface Uuid {
        type: "uuid";
    }

    /**
     * An object.
     */
    export interface Object {
        type: "object";
        class: () => Class;
    }

    /**
     * An object with an id.
     */
    export interface Entity {
        idName: string;
        type: "entity";
        class: () => Class;
    }
}
