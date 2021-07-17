import { inRange, inSet, or } from "../../../src";
import { isFullyReduced, isNotReduced, isPartiallyReduced } from "./criteria-reduction-helpers";

xdescribe("reduce: in-range", () => {
    describe("full reduction", () => {
        isFullyReduced(inRange(1, 7), inRange(1, 7));
        isFullyReduced(inRange(1, 7), inRange(0, 8));
        isFullyReduced(inRange(1, 7), inRange(0, 8, false));
        isFullyReduced(inRange(1, 7), inRange(0, void 0));
        isFullyReduced(inRange(4, void 0), inRange(3, void 0));
        isFullyReduced(inRange(void 0, 4), inRange(void 0, 5));
        isFullyReduced(inRange(1, 7), inRange(void 0, 9));
    });

    describe("partial reduction", () => {
        describe("head reduction", () => {
            isPartiallyReduced(inRange(1, 7), inRange(-3, 5), inRange(5, 7, [false, true]));
            isPartiallyReduced(inRange(3, void 0), inRange(1, 8), inRange(8, void 0, false));
            isPartiallyReduced(inRange(3, void 0), inRange(1, 8, [true, false]), inRange(8, void 0));
            isPartiallyReduced(inRange(1, 7), inRange(void 0, 3, false), inRange(3, 7));
        });

        fdescribe("tail reduction", () => {
            isPartiallyReduced(inRange(1, 7), inRange(3, 10), inRange(1, 3, [true, false]));
            isPartiallyReduced(inRange(1, 7), inRange(3, 8, [false, true]), inRange(1, 3));
            isPartiallyReduced(inRange(void 0, 3), inRange(1, 8), inRange(void 0, 1, false));
            isPartiallyReduced(inRange(void 0, 3), inRange(1, 8, [false, true]), inRange(void 0, 1));
            isPartiallyReduced(inRange(1, 7), inRange(3, void 0), inRange(1, 3, [true, false]));
        });

        describe("body reduction", () => {
            isPartiallyReduced(inRange(1, 7), inRange(3, 4), or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]));
            isPartiallyReduced(inRange(1, 7, false), inRange(3, 4), or([inRange(1, 3, false), inRange(4, 7, false)]));
            isPartiallyReduced(inRange(1, 7, false), inRange(3, 3, false), or([inRange(1, 3, [false, true]), inRange(3, 7, [true, false])]));
            isPartiallyReduced(inRange(void 0, 7), inRange(3, 4), or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));
            isPartiallyReduced(inRange(void 0, 7), inRange(3, 4, false), or([inRange(void 0, 3), inRange(4, 7)]));
            isPartiallyReduced(inRange(1, void 0), inRange(3, 4), or([inRange(1, 3, [true, false]), inRange(4, void 0, false)]));
            isPartiallyReduced(inRange(1, void 0), inRange(3, 4, false), or([inRange(1, 3), inRange(4, void 0)]));
            isPartiallyReduced(inRange(1, 7), inRange(1, 7, false), or([inRange(1, 1), inRange(7, 7)]));
        });

        describe("reduction by: in", () => {
            isPartiallyReduced(inRange(1, 2), inSet([2]), inRange(1, 2, [true, false]));
            isPartiallyReduced(inRange(1, 2), inSet([1]), inRange(1, 2, [false, true]));
            isPartiallyReduced(inRange(1, 2), inSet([1, 2]), inRange(1, 2, false));
            isPartiallyReduced(inRange(void 0, 2), inSet([1, 2]), inRange(void 0, 2, false));
            isPartiallyReduced(inRange(1, void 0), inSet([1, 2]), inRange(1, void 0, false));
        });
    });

    describe("no reduction", () => {
        // [todo] now that we allow for splitting a range into smaller parts we might want this reduction to actually do something
        // (instead of doing nothing). the problem is though that a "from-to" reduced by an "in" with lots of values will create
        // lots of queries and hinder performance. also, it would only work with from-to of type integer (which we don't distinguish yet)
        isNotReduced(inRange(1, 3), inSet([2]));
        isNotReduced(inRange(1, 7), inRange(7, 13, [false, true]));
        isNotReduced(inRange(1, 7), inRange(8, 13));
        isNotReduced(inRange(1, 7), inRange(void 0, 1, false));
        isNotReduced(inRange(1, 7), inRange(void 0, 0));
    });
});
