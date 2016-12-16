import { IEntityType } from "./entity-decorator";
import { Navigation } from "./navigation";

export class Collection extends Navigation {
    readonly backReferenceKeyName: string;
    readonly backReferenceName: string;

    constructor(args: Collection.ICtorArgs) {
        super({
            name: args.name,
            otherType: args.otherType
        });

        this.backReferenceKeyName = args.backReferenceKeyName;
        this.backReferenceName = args.backReferenceName;
    }
}

export module Collection {
    export interface ICtorArgs {
        backReferenceKeyName: string;
        backReferenceName: string;
        name: string;
        otherType: () => IEntityType;
    }
}
