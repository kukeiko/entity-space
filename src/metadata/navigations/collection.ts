import { EntityType } from "../entity.type";
import { NavigationBase } from "./navigation-base";

/**
 * Array of entities of which this entity has the keys stored in an array.
 */
export class Collection extends NavigationBase {
    readonly type = "array:ref";
    readonly keysName: string;

    constructor(args: Collection.CtorArgs) {
        super({
            dtoName: args.dtoName,
            virtual: args.virtual,
            name: args.name,
            other: args.other
        });

        this.keysName = args.keys;
    }
}

export module Collection {
    export interface CtorArgs {
        dtoName?: string;
        keys: string;
        name: string;
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
