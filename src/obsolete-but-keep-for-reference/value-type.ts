import { Class } from "../lang";

export type ValueType =
    | ValueType.Array<any>
    | ValueType.Boolean
    | ValueType.Date
    | ValueType.Map2<any, any>
    | ValueType.Number
    | ValueType.Set
    | ValueType.String
    | ValueType.Uuid
    | ValueType.Object;

export module ValueType {
    export type ToValue<T> = T extends Boolean
        ? boolean
        : T extends Array<infer U>
        ? ToValue<U>[]
        : T extends Date
        ? string
        : T extends Map2<infer K, infer V>
        ? Map<ToValue<K>, ToValue<V>>
        : T extends Number
        ? number
        : T extends Set
        ? (boolean | number | string)[]
        : T extends String
        ? string
        : T extends Uuid
        ? string
        : T extends Object<infer U>
        ? U
        : never;

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

    export type Scalar = Boolean | Date | Number | String | Uuid;

    export interface Array<T extends ValueType> {
        type: "array";
        valueType: T;
    }

    export interface Map2<K extends Scalar, T extends ValueType> {
        type: "map";
        keyValueType: K;
        valueType: T;
    }

    /**
     * An object.
     */
    export interface Object<T = any> {
        type: "object";
        // [todo] re-evaluate if its really necessary to have lazy binding
        class: () => Class<T>;
    }

    /**
     * An object with an id.
     */
    export interface Entity<T = any> {
        idName: string;
        type: "entity";
        // [todo] re-evaluate if its really necessary to have lazy binding
        class: () => Class<T>;
    }
}