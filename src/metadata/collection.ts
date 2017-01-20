import { IEntityType } from "./entity-type";
import { Navigation } from "./navigation";
import { ValueType } from "./value-type";

export class Collection extends Navigation {
    readonly backReferenceName: string;

    constructor(args: Collection.ICtorArgs) {
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

export module Collection {
    export interface ICtorArgs {
        alias?: string;
        back: string;
        name: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }
}
