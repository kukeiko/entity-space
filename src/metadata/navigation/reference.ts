import { IEntityType } from "../entity-type";
import { Navigation } from "./navigation";

/**
 * A property that points to one related entity.
 */
export class Reference extends Navigation {
    readonly type = "ref";
    readonly keyName: string;

    constructor(args: Reference.ICtorArgs) {
        super({
            alias: args.alias,
            virtual: args.virtual,
            name: args.name,
            other: args.other
        });

        this.keyName = args.key;
    }
}

export module Reference {
    export interface ICtorArgs {
        alias?: string;
        key: string;
        name: string;
        other: () => IEntityType<any>;
        virtual?: boolean;
    }
}
