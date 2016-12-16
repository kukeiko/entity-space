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
    export interface ICtorArgs extends Navigation.ICtorArgs {
        backReferenceKeyName: string;
        backReferenceName: string;
    }
}
