import { Entity, PackedEntitySelection, WhereEntity } from "@entity-space/elements";
import { Class } from "@entity-space/utils";

export interface QueryCacheOptions {
    key?: unknown;
    refresh?: boolean;
    refreshDelay?: number;
}

export interface QueryArguments {
    blueprint: Class;
    select?: PackedEntitySelection;
    where?: WhereEntity;
    parameters?: QueryArgumentsParameters;
    cache?: boolean | QueryCacheOptions;
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
