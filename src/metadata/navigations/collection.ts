import { NavigationBase } from "./navigation-base";

/**
 * Array of entities of which this entity has the keys stored in an array.
 */
export class Collection extends NavigationBase {
    readonly type = "array:ref";
    readonly keysName: string;

    constructor(name: string, args: Collection.CtorArgs) {
        super(name, args);

        this.keysName = args.keys;
    }
}

export module Collection {
    export interface CtorArgs extends NavigationBase.CtorArgs {
        keys: string;
    }
}
