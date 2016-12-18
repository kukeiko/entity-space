import { IEntityType } from "./entity-decorator";
import { Navigation } from "./navigation";
import { ObjectMetadata } from "./value-metadata";
import { ValueType } from "./value-type";

export class Reference extends Navigation {
    readonly keyName: string;

    constructor(args: Reference.ICtorArgs) {
        super({
            dtoName: args.dtoName,
            name: args.name,
            otherType: args.otherType,
            valueMetadata: <ObjectMetadata>{
                type: ValueType.Object
            }
        });

        this.keyName = args.keyName;
    }
}

export module Reference {
    export interface ICtorArgs {
        keyName: string;
        dtoName?: string;
        name: string;
        otherType: () => IEntityType;
    }
}
