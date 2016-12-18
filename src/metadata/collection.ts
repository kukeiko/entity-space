import { IEntityType } from "./entity-decorator";
import { Navigation } from "./navigation";
import { ArrayMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Collection extends Navigation {
    readonly backReferenceName: string;

    constructor(args: Collection.ICtorArgs) {
        super({
            dtoName: args.dtoName,
            name: args.name,
            otherType: args.otherType,
            valueMetadata: <ArrayMetadata>{
                type: ValueType.Array
            }
        });

        this.backReferenceName = args.backReferenceName;
    }
}

export module Collection {
    export interface ICtorArgs {
        backReferenceName: string;
        dtoName?: string;
        name: string;
        otherType: () => IEntityType;
    }
}
