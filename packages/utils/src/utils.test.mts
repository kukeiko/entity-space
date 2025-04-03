import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("utils", () => {
    it("should work", () => {
        expect(packageName).toEqual("utils");
    });
});
