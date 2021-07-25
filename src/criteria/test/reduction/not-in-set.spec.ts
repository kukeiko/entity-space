import { reducing } from "./reducing.fn";

describe("reducing: not-in-set", () => {
    describe("full reduction", () => {
        reducing("!{1, 2}").by("!{1, 2}").is(true);
        reducing("!{1, 2}").by("!{1}").is(true);
    });

    describe("partial reduction", () => {
        reducing("!{1, 2}").by("!{1, 2, 3}").is("{3}");
        reducing("!{1}").by("!{2, 3}").is("{2, 3}");
        reducing("!{1, 2}").by("{2, 3}").is("!{1, 2, 3}");
    });

    describe("no reduction", () => {
        reducing("!{1, 2, 3}").by("[4, 7]").is(false);
    });
});
