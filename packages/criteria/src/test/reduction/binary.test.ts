import { reducing } from "../tools/reducing.fn";

describe("reducing: binary", () => {
    describe("full reduction", () => {
        reducing("even").by("even").shouldBe(true);
    });
});
