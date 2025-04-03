import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("core", () => {
    it("should work", () => {
        expect(packageName).toEqual("core");
    });
});
