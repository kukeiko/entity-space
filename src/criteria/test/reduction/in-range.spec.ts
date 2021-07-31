import { reducing } from "./reducing.fn";

describe("reducing: in-range", () => {
    describe("full reduction", () => {
        reducing("[1, 7]").by("[1, 7]").shouldBe(true);
        reducing("[1, 7]").by("[0, 8]").shouldBe(true);
        reducing("[1, 7]").by("(0, 8)").shouldBe(true);
        reducing("[1, 7]").by("[0, ...]").shouldBe(true);
        reducing("[4, ...]").by("[3, ...]").shouldBe(true);
        reducing("[..., 4]").by("[..., 5]").shouldBe(true);
        reducing("[1, 7]").by("[..., 9]").shouldBe(true);
    });

    describe("partial reduction", () => {
        describe("head reduction", () => {
            reducing("[1, 7]").by("[-3, 5]").shouldBe("(5, 7]");
            reducing("[3, ...]").by("[1, 8]").shouldBe("(8, ...]");
            reducing("[3, ...]").by("[1, 8)").shouldBe("[8, ...]");
            reducing("[1, 7]").by("[..., 3)").shouldBe("[3, 7]");
        });

        describe("tail reduction", () => {
            reducing("[1, 7]").by("[3, 10]").shouldBe("[1, 3)");
            reducing("[1, 7]").by("(3, 8]").shouldBe("[1, 3]");
            reducing("[..., 3]").by("[1, 8]").shouldBe("[..., 1)");
            reducing("[..., 3]").by("(1, 8]").shouldBe("[..., 1]");
            reducing("[1, 7]").by("[3, ...]").shouldBe("[1, 3)");
        });

        describe("body reduction", () => {
            reducing("[1, 7]").by("[3, 4]").shouldBe("[1, 3) | (4, 7]");
            reducing("(1, 7)").by("[3, 4]").shouldBe("(1, 3) | (4, 7)");
            reducing("(1, 7)").by("(3, 3)").shouldBe("(1, 3] | [3, 7)");
            reducing("[..., 7]").by("[3, 4]").shouldBe("[..., 3) | (4, 7]");
            reducing("[..., 7]").by("(3, 4)").shouldBe("[..., 3] | [4, 7]");
            reducing("[1, ...]").by("[3, 4]").shouldBe("[1, 3) | (4, ...]");
            reducing("[1, ...]").by("(3, 4)").shouldBe("[1, 3] | [4, ...]");
            reducing("[1, 7]").by("(1, 7)").shouldBe("[1, 1] | [7, 7]");
        });

        describe("reduction by: in", () => {
            reducing("[1, 2]").by("{2}").shouldBe("[1, 2)");
            reducing("[1, 2]").by("{1}").shouldBe("(1, 2]");
            reducing("[1, 2]").by("{1, 2}").shouldBe("(1, 2)");
            reducing("[..., 2]").by("{1, 2}").shouldBe("[..., 2)");
            reducing("[1, ...]").by("{1, 2}").shouldBe("(1, ...]");
        });
    });

    describe("no reduction", () => {
        reducing("[1, 3]").by("{2}").shouldBe(false);
        reducing("[1, 7]").by("(7, 13]").shouldBe(false);
        reducing("[1, 7]").by("[8, 13]").shouldBe(false);
        reducing("[1, 7]").by("[..., 1)").shouldBe(false);
        reducing("[1, 7]").by("[..., 0]").shouldBe(false);
    });
});
