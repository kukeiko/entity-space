import { reducing } from "./reducing.fn";

describe("reducing: not-value", () => {
    /**
     * A criteria that is a subset of another should always be completely reduced.
     */
    describe("full reduction", () => {
        reducing("!7").by("!7").shouldBe(true);
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no reduction", () => {
        reducing("!7").by("!3").shouldBe(false);
    });
});
