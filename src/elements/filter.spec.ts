import { Filter } from "./filter";

fdescribe("filter", () => {
    describe("reduce", () => {
        it('["from-to", [1, 7]] reduce ["from-to", [3, 9]] => ["from-to", [7, 9]]', () => {
            let a = new Filter({ rank: ["from-to", [1, 7]] });
            let b = new Filter({ rank: ["from-to", [3, 9]] });

            let r = a.reduce(b);

            expect(r).not.toBeNull();
            expect(r.criteria).toEqual({ rank: ["from-to", [7, 9]] });
        });

        it('["from-to", [1, 7]] reduce ["from-to", [-3, 3]] => ["from-to", [-3, 1]]', () => {
            let a = new Filter({ rank: ["from-to", [1, 7]] });
            let b = new Filter({ rank: ["from-to", [-3, 3]] });

            let r = a.reduce(b);

            expect(r).not.toBeNull();
            expect(r.criteria).toEqual({ rank: ["from-to", [-3, 1]] });
        });

        it('["from-to", [1, 7]] reduce ["from-to", [-3, 9]] => ["from-to", [-3, 9]]', () => {
            let a = new Filter({ rank: ["from-to", [1, 7]] });
            let b = new Filter({ rank: ["from-to", [-3, 9]] });

            let r = a.reduce(b);

            expect(r).not.toBeNull();
            expect(r.criteria).toEqual({ rank: ["from-to", [-3, 9]] });
        });

        it('["from-to", [1, 7]] reduce ["from-to", [1, 7]] => null', () => {
            let a = new Filter({ rank: ["from-to", [1, 7]] });
            let b = new Filter({ rank: ["from-to", [1, 7]] });

            let r = a.reduce(b);

            expect(r).toBeNull();
        });
    });
});
