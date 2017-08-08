import { EntityType } from "../entity.type";
import { NavigationBase } from "./navigation-base";

/**
 * Array of entities which have a back reference to this entity (parent/child relationship).
 */
export class Children extends NavigationBase {
    readonly type = "array:child";
    readonly backReferenceName: string;

    constructor(args: Children.CtorArgs) {
        super({
            dtoName: args.dtoName,
            virtual: args.virtual,
            name: args.name,
            other: args.other
        });

        this.backReferenceName = args.back;
    }
}

export module Children {
    export interface CtorArgs {
        dtoName?: string;
        back: string;
        name: string;
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
