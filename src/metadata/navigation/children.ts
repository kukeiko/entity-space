import { IEntityClass } from "../entity-class";
import { Navigation } from "./navigation";

/**
 * Array of entities which have a back reference to this entity (parent/child relationship).
 */
export class Children extends Navigation {
    readonly type = "array:child";
    readonly backReferenceName: string;

    constructor(args: Children.ICtorArgs) {
        super({
            alias: args.alias,
            virtual: args.virtual,
            name: args.name,
            other: args.other
        });

        this.backReferenceName = args.back;
    }
}

export module Children {
    export interface ICtorArgs {
        alias?: string;
        back: string;
        name: string;
        other: () => IEntityClass<any>;
        virtual?: boolean;
    }
}
