import { reducing } from "./reducing.fn";

describe("reducing: not-in-set", () => {
    describe("full reduction", () => {
        reducing("!{1, 2}").by("!{1, 2}").shouldBe(true);
        reducing("!{1, 2}").by("!{1}").shouldBe(true);
    });

    describe("partial reduction", () => {
        reducing("!{1, 2}").by("!{1, 2, 3}").shouldBe("{3}");
        reducing("!{1}").by("!{2, 3}").shouldBe("{2, 3}");
        reducing("!{1, 2}").by("{2, 3}").shouldBe("!{1, 2, 3}");
    });

    describe("no reduction", () => {
        reducing("!{1, 2, 3}").by("[4, 7]").shouldBe(false);
    });
});
