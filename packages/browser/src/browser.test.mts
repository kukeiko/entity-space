import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("browser", () => {
    it("should work", () => {
        expect(packageName).toEqual("browser");
    });
});
