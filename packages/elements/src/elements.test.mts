import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("elements", () => {
    it("should work", () => {
        expect(packageName).toEqual("elements");
    });
});
