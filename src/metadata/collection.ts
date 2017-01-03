import { IEntityType } from "./entity-type";
import { Navigation } from "./navigation";
import { ArrayMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Collection extends Navigation {
    readonly backReferenceName: string;

    constructor(args: Collection.ICtorArgs) {
        super({
            dtoName: args.dtoName,
            virtual: args.virtual,
            name: args.name,
            other: args.other,
            valueMetadata: <ArrayMetadata>{
                type: ValueType.Array
            }
        });

        this.backReferenceName = args.back;
    }
}

export module Collection {
    export interface ICtorArgs {
        back: string;
        dtoName?: string;
        name: string;
        other: () => IEntityType;
        virtual?: boolean;
    }
}
