export interface PropertyComponent<
    K extends string = string,
    V = unknown,
    F extends PropertyComponent.Flags = never,
    EV = "n" extends F ? V | null : V
    > {
    creatable: "c" extends F ? true : false;
    name: K;
    nullable: "n" extends F ? true : false;
    patchable: "p" extends F ? true : false;
    read<U extends Record<K, EV>>(instance: U): EV;
    unique: "u" extends F ? true : false;
}

export module PropertyComponent {
    export type Flags
        = "c"
        | "n"
        | "p"
        | "u";

    export interface Any {
        creatable: boolean;
        name: string;
        nullable: boolean;
        patchable: boolean;
        read(instance: object): any;
        unique: boolean;
    }
}
