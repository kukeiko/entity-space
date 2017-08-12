import { NavigationBase } from "./navigation-base";

/**
 * A property that points to one related entity.
 */
export class Reference extends NavigationBase {
    readonly type = "ref";
    readonly keyName: string;

    constructor(name: string, args: Reference.CtorArgs) {
        super(name, args);

        this.keyName = args.key;
    }
}

export module Reference {
    export interface CtorArgs extends NavigationBase.CtorArgs{
        key: string;
    }
}
