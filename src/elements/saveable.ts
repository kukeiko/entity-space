import { StringIndexable } from "../util";
import { AnyEntityType, IEntity, EntityType } from "../metadata";

export class Saveable<T> {
    isNew: boolean = false;
    origin: T = null;
    dto: Saveable.Dto = null;

    constructor(args: {
        isNew: boolean;
        origin: T;
        dto: Saveable.Dto;
    }) {
        this.isNew = args.isNew;
        this.origin = args.origin;
        this.dto = args.dto;
    }
}

export module Saveable {
    export interface Dto {
        full: StringIndexable;
        saveable: StringIndexable;
        patch: StringIndexable;
    }
}

export class Saveables {
    private _perType: Map<AnyEntityType, Saveable<any>[]> = null;

    constructor(saveables: Map<AnyEntityType, Saveable<any>[]>) {
        this._perType = saveables;
        Object.freeze(this._perType);
    }

    all(): Map<AnyEntityType, Saveable<any>[]> {
        return this._perType;
    }

    ofType<T extends IEntity>(entityType: EntityType<T>): Saveable<T>[] {
        return this._perType.get(entityType) || [];
    }
}
