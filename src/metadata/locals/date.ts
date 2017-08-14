import { LocalBase } from "./local-base";

// the reason it is called DateTime instead of Date is to prevent
// name collision with the native Date
export class DateTime extends LocalBase {
    readonly type = "date";

    constructor(name: string, args: LocalBase.CtorArgs) {
        super(name, args);
    }
}

export module DateTime {
    export type CtorArgs = LocalBase.CtorArgs;
}
