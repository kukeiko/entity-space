import { IEntityClass } from "../entity-class";
import { Property } from "../property";
import { getEntityMetadata } from "../entity-decorator";
import { EntityMetadata } from "../entity-metadata";

/**
 * A property that points to one (Reference) or many (Children, Collection) related entities.
 */
export abstract class Navigation extends Property {
    readonly virtual: boolean;

    get otherType(): IEntityClass<any> { return this._otherType(); };
    private _otherType: () => IEntityClass<any>;

    get otherTypeMetadata(): EntityMetadata<any> {
        return (this._otherTypeMetadata = this._otherTypeMetadata || getEntityMetadata(this.otherType));
    }
    private _otherTypeMetadata: EntityMetadata<any> = null;

    constructor(args: Navigation.ICtorArgs) {
        super(args);

        this._otherType = args.other;
        this.virtual = !!args.virtual;
    }
}

export module Navigation {
    export interface ICtorArgs extends Property.ICtorArgs {
        other: () => IEntityClass<any>;
        virtual?: boolean;
    }
}
