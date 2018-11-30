import { NavigationBase } from "./navigation-base";

/**
 * Array of entities which have a back reference to this entity (parent/child relationship).
 */
export class Children extends NavigationBase {
    // we have to explicitly state the type, otherwise its missing @ .d.ts
    readonly type: "children" = "children";
    readonly backReferenceName: string;

    constructor(name: string, args: Children.CtorArgs) {
        super(name, args);

        this.backReferenceName = args.back;
    }
}

export module Children {
    export interface CtorArgs extends NavigationBase.CtorArgs {
        back: string;
    }
}
