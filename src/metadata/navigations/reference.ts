import { EntityType } from "../entity.type";
import { NavigationBase } from "./navigation-base";

/**
 * A property that points to one related entity.
 */
export class Reference extends NavigationBase {
    readonly type = "ref";
    readonly keyName: string;

    constructor(args: Reference.CtorArgs) {
        super({
            dtoName: args.dtoName,
            virtual: args.virtual,
            name: args.name,
            other: args.other
        });

        this.keyName = args.key;
    }
}

export module Reference {
    export interface CtorArgs {
        dtoName?: string;
        key: string;
        name: string;
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
