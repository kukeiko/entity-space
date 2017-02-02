import { IEntityType } from "../../entity-type";
import { ValueType } from "../value-type";
import { Navigation } from "./navigation";

/**
 * Array of entities of which this entity has the keys to, in an array.
 */
export class Collection extends Navigation {
    readonly type = "array:ref";
    readonly keysName: string;

    constructor(args: Collection.ICtorArgs) {
        super({
            alias: args.alias,
            virtual: args.virtual,
            name: args.name,
            other: args.other,
            saveable: args.saveable,
            valueType: ValueType.Array
        });

        this.keysName = args.keys;
    }
}

export module Collection {
    export interface ICtorArgs {
        alias?: string;
        keys: string;
        name: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }
}
