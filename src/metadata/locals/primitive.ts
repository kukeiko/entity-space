import { LocalBase } from "./local-base";

export class Primitive extends LocalBase {
    readonly type = "primitive";
    readonly index: boolean;
    readonly valueType: Primitive.ValueType;

    constructor(name: string, args: Primitive.CtorArgs) {
        super(name, args);

        this.index = !!args.index;
        this.valueType = args.valueType != null ? args.valueType : "unknown";
    }
}

export module Primitive {
    export interface CtorArgs extends LocalBase.CtorArgs {
        index?: boolean;
        valueType?: ValueType;
    }

    export type ValueType =
        "unknown"
        | "guid";
}
