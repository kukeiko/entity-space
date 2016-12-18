import { ValueType } from "./value-type";

export interface AnyMetadata {
    type: ValueType.Any
}

export interface ArrayMetadata {
    type: ValueType.Array
}

export interface BooleanMetadata {
    type: ValueType.Boolean
}

export interface DateMetadata {
    type: ValueType.Date
}

export interface DecimalMetadata {
    type: ValueType.Decimal
}

export interface FloatMetadata {
    type: ValueType.Float
}

export interface IntegerMetadata {
    type: ValueType.Integer
}

export interface ObjectMetadata {
    type: ValueType.Object
}

export interface StringMetadata {
    type: ValueType.String
}

export type ValueMetadata =
    ArrayMetadata
    | AnyMetadata
    | BooleanMetadata
    | DateMetadata
    | DecimalMetadata
    | FloatMetadata
    | IntegerMetadata
    | ObjectMetadata
    | StringMetadata;
