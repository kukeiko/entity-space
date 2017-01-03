import { IEntityType } from "./entity-type";
import { Navigation } from "./navigation";
import { ObjectMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Reference extends Navigation {
    readonly keyName: string;

    constructor(args: Reference.ICtorArgs) {
        super({
            dtoName: args.dtoName,
            virtual: args.virtual,
            name: args.name,
            other: args.other,
            valueMetadata: <ObjectMetadata>{
                type: ValueType.Object
            }
        });

        this.keyName = args.key;
    }
}

export module Reference {
    export interface ICtorArgs {
        key: string;
        dtoName?: string;
        name: string;
        other: () => IEntityType;
        virtual?: boolean;
    }
}
