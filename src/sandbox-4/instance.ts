import { Type } from "./type";

export type Instance<T extends Type> = {
    [K in keyof T["properties"]]: ReturnType<T["properties"][K]["read"]>;
};
