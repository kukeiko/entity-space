import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: in-range", () => {
    describe("full subtraction", () => {
        subtracting("[1, 7]").by("[1, 7]").shouldBe(true);
        subtracting("[1, 7]").by("[0, 8]").shouldBe(true);
        subtracting("[1, 7]").by("(0, 8)").shouldBe(true);
        subtracting("[1, 7]").by("[0, ...]").shouldBe(true);
        subtracting("[4, ...]").by("[3, ...]").shouldBe(true);
        subtracting("[..., 4]").by("[..., 5]").shouldBe(true);
        subtracting("[1, 7]").by("[..., 9]").shouldBe(true);
    });

    describe("partial subtraction", () => {
        describe("head subtraction", () => {
            subtracting("[1, 7]").by("[-3, 5]").shouldBe("(5, 7]");
            subtracting("[3, ...]").by("[1, 8]").shouldBe("(8, ...]");
            subtracting("[3, ...]").by("[1, 8)").shouldBe("[8, ...]");
            subtracting("[1, 7]").by("[..., 3)").shouldBe("[3, 7]");
        });

        describe("tail subtraction", () => {
            subtracting("[1, 7]").by("[3, 10]").shouldBe("[1, 3)");
            subtracting("[1, 7]").by("(3, 8]").shouldBe("[1, 3]");
            subtracting("[..., 3]").by("[1, 8]").shouldBe("[..., 1)");
            subtracting("[..., 3]").by("(1, 8]").shouldBe("[..., 1]");
            subtracting("[1, 7]").by("[3, ...]").shouldBe("[1, 3)");
        });

        describe("body subtraction", () => {
            subtracting("[1, 7]").by("[3, 4]").shouldBe("[1, 3) | (4, 7]");
            subtracting("(1, 7)").by("[3, 4]").shouldBe("(1, 3) | (4, 7)");
            subtracting("(1, 7)").by("(3, 3)").shouldBe("(1, 3] | [3, 7)");
            subtracting("[..., 7]").by("[3, 4]").shouldBe("[..., 3) | (4, 7]");
            subtracting("[..., 7]").by("(3, 4)").shouldBe("[..., 3] | [4, 7]");
            subtracting("[1, ...]").by("[3, 4]").shouldBe("[1, 3) | (4, ...]");
            subtracting("[1, ...]").by("(3, 4)").shouldBe("[1, 3] | [4, ...]");
            subtracting("[1, 7]").by("(1, 7)").shouldBe("[1, 1] | [7, 7]");
        });

        describe("subtraction by: in", () => {
            subtracting("[1, 2]").by("{2}").shouldBe("[1, 2)");
            subtracting("[1, 2]").by("{1}").shouldBe("(1, 2]");
            subtracting("[1, 2]").by("{1, 2}").shouldBe("(1, 2)");
            subtracting("[..., 2]").by("{1, 2}").shouldBe("[..., 2)");
            subtracting("[1, ...]").by("{1, 2}").shouldBe("(1, ...]");
        });
    });

    describe("no subtraction", () => {
        subtracting("[1, 3]").by("{2}").shouldBe(false);
        subtracting("[1, 7]").by("(7, 13]").shouldBe(false);
        subtracting("[1, 7]").by("[8, 13]").shouldBe(false);
        subtracting("[1, 7]").by("[..., 1)").shouldBe(false);
        subtracting("[1, 7]").by("[..., 0]").shouldBe(false);
    });
});
