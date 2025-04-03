import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("node", () => {
    it("should work", () => {
        expect(packageName).toEqual("node");
    });
});
