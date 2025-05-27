import { describe, it } from "vitest";
import { EntitySource } from "./entity-source";

describe(EntitySource, () => {
    it.skip("should throw if load() returned undefined", () => {
        // [todo] actually, might be convenient for the user if they can return undefined/null?
        // but still, current EntitySource should widen return value of load() if it does accept it.
        // currently it works to return undefined, but can easily cause errors later on if we don't type test against it.
    });
});
