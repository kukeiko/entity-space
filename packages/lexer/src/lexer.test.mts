import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("lexer", () => {
    it("should work", () => {
        expect(packageName).toEqual("lexer");
    });
});
