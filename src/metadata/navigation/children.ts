import { IEntityType } from "../../entity-type";
import { ValueType } from "../value-type";
import { Navigation } from "./navigation";

/**
 * Array of entities which have a back reference to this entity.
 */
export class Children extends Navigation {
    readonly type = "array:child";
    readonly backReferenceName: string;

    constructor(args: Children.ICtorArgs) {
        super({
            alias: args.alias,
            virtual: args.virtual,
            name: args.name,
            other: args.other,
            saveable: args.saveable,
            valueType: ValueType.Array
        });

        this.backReferenceName = args.back;
    }
}

export module Children {
    export interface ICtorArgs {
        alias?: string;
        back: string;
        name: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }
}
