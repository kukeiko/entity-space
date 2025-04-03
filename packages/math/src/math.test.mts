import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("math", () => {
    it("should work", () => {
        expect(packageName).toEqual("math");
    });
});
