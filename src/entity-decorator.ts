import { Class, Fields } from "./lang";

export const EntityMetadataSymbol: unique symbol = Symbol();

export function DefineEntity(args: { id: string }) {
    return <T extends Class>(type: T) => {};
}

export module DefineEntity {
    export function String(args?: { nullable?: boolean; optional?: boolean }) {
        return <T>(type: Object, key: string) => {};
    }

    export function Reference(args: {
        nullable?: boolean;
        optional?: boolean;
        other: () => Class;
        /**
         * Defaults to property name + "Id"
         */
        id?: string;
    }) {
        return <T>(type: Object, key: string, foo?: any) => {
            console.log("reference", type, key, foo, args);
        };
    }

    export type CtorArgs<T> = Partial<Pick<T, Fields<T>>>;
}
