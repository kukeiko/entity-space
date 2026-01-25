// for some reason, this file has to be nested inside another folder in order to be picked up properly.
import "vitest";
import { Mock } from "vitest";

declare module "vitest" {
    interface Assertion<T = any> {
        toHaveBeenCalledBefore(other: Mock): void;
        toHaveBeenCalledAfter(other: Mock): void;
    }
}
