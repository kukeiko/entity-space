import { reducing } from "./reducing.fn";

describe("reducing: binary", () => {
    describe("full reduction", () => {
        reducing("even").by("even").shouldBe(true);
    });
});
