import { reducing } from "./reducing.fn";

describe("reducing: binary", () => {
    describe("full reduction", () => {
        reducing("is-even").by("is-even").shouldBe(true);
    });
});
