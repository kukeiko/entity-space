import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("schema", () => {
    it("should work", () => {
        expect(packageName).toEqual("schema");
    });
});
