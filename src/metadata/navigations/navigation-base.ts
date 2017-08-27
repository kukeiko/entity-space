import { EntityType } from "../entity.type";
import { getEntityMetadata } from "../entity.decorator";
import { PropertyBase } from "../property-base";
import { EntityMetadata } from "../entity-metadata";

/**
 * A property that points to one (Reference) or many (Children, Collection) related entities.
 */
export abstract class NavigationBase extends PropertyBase {
    readonly base = "navigation";
    readonly virtual: boolean;

    get otherType(): EntityType<any> { return this._otherType(); };
    private _otherType: () => EntityType<any>;

    get otherTypeMetadata(): EntityMetadata<any> {
        return (this._otherTypeMetadata = this._otherTypeMetadata || getEntityMetadata(this.otherType));
    }
    private _otherTypeMetadata: EntityMetadata<any> = null;

    constructor(name: string, args: NavigationBase.CtorArgs) {
        super(name, args);

        this._otherType = args.other;
        this.virtual = !!args.virtual;
    }
}

export module NavigationBase {
    export interface CtorArgs extends PropertyBase.CtorArgs {
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
