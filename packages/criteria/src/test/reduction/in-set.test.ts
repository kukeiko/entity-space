import { reducing } from "../tools/reducing.fn";

describe("reducing: in-set", () => {
    /**
     * A criteria that is a subset of another should always be completely reduced.
     */
    describe("full reduction", () => {
        reducing("{1, 2, 3}").by("{1, 2, 3}").shouldBe(true);
        reducing("{1, 2, 3}").by("{1, 2, 3, 4}").shouldBe(true);
        reducing("{1, 2, 3}").by("!{4}").shouldBe(true);
    });

    /**
     * An intersection between two criteria should always be removed.
     */
    describe("partial reduction", () => {
        reducing("{1, 2, 3}").by("{1, 2, 4}").shouldBe("{3}");
        reducing("{1, 2, 3}").by("!{1}").shouldBe("{1}");
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no reduction", () => {
        reducing("{1, 2, 3}").by("{4, 5, 6}").shouldBe(false);
        reducing("{1, 2, 3}").by("!{1, 2, 3}").shouldBe(false);
        reducing("{1, 2, 3}").by("[1, 3]").shouldBe(false);
    });
});
