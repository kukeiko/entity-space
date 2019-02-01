export module Modifier {
    export type Creatable = {
        creatable: true;
    };

    export type Patchable = {
        patchable: true;
    } & Creatable;

    export type Nullable = {
        nullable: true;
    };
}
