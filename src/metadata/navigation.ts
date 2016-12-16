import { IEntityType } from "./entity-decorator";
import { Property } from "./property";

export class Navigation extends Property {
    private _otherType: () => IEntityType;
    get otherType(): IEntityType { return this._otherType(); };

    constructor(args: {
        name: string;
        otherType: () => IEntityType;
    }) {
        super({ name: args.name });

        this._otherType = args.otherType;
    }
}
