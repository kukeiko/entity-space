import { Entity, EntitySchema, EntitySelection, PackedEntitySelection, WhereEntity } from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { Subject } from "rxjs";

export interface QueryOptions {
    schema: EntitySchema;
    selection: EntitySelection;
}

export interface QueryReactivityOptions {
    additionalBlueprints?: Class[];
}

export interface QueryCacheOptions {
    key?: unknown;
    refresh?: boolean;
    refreshDelay?: number;
    reactive?: boolean | QueryReactivityOptions;
}

export interface QueryArguments {
    schema: EntitySchema;
    select?: PackedEntitySelection;
    where?: WhereEntity;
    parameters?: QueryArgumentsParameters;
    cache?: boolean | QueryCacheOptions;
    isLoading$?: Subject<boolean>;
}

export interface QueryArgumentsParameters {
    blueprint: Class;
    value: Entity;
}

export interface HydrateArguments {
    blueprint: Class;
    entities: Entity[];
    select: PackedEntitySelection;
    cache?: boolean | QueryCacheOptions;
}
