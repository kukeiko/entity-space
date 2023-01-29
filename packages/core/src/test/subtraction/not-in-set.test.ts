import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: not-in-set", () => {
    describe("full subtraction", () => {
        subtracting("!{1, 2}").by("!{1, 2}").shouldBe(true);
        subtracting("!{1, 2}").by("!{1}").shouldBe(true);
    });

    describe("partial subtraction", () => {
        subtracting("!{1, 2}").by("!{1, 2, 3}").shouldBe("{3}");
        subtracting("!{1}").by("!{2, 3}").shouldBe("{2, 3}");
        subtracting("!{1, 2}").by("{2, 3}").shouldBe("!{1, 2, 3}");
    });

    describe("no subtraction", () => {
        subtracting("!{1, 2, 3}").by("[4, 7]").shouldBe(false);
    });
});
