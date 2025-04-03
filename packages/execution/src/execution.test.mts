import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("execution", () => {
    it("should work", () => {
        expect(packageName).toEqual("execution");
    });
});
