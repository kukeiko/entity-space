import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: in-set", () => {
    /**
     * A criteria that is a subset of another should always be completely subtracted.
     */
    describe("full subtraction", () => {
        subtracting("{1, 2, 3}").by("{1, 2, 3}").shouldBe(true);
        subtracting("{1, 2, 3}").by("{1, 2, 3, 4}").shouldBe(true);
        subtracting("{1, 2, 3}").by("!{4}").shouldBe(true);
    });

    /**
     * An intersection between two criteria should always be removed.
     */
    describe("partial subtraction", () => {
        subtracting("{1, 2, 3}").by("{1, 2, 4}").shouldBe("{3}");
        subtracting("{1, 2, 3}").by("!{1}").shouldBe("{1}");
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no subtraction", () => {
        subtracting("{1, 2, 3}").by("{4, 5, 6}").shouldBe(false);
        subtracting("{1, 2, 3}").by("!{1, 2, 3}").shouldBe(false);
        subtracting("{1, 2, 3}").by("[1, 3]").shouldBe(false);
    });
});
