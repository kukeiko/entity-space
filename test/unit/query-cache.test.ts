import { EntityClass, Query, QueryCache, Property } from "../../src";

describe("query-cache", () => {
    describe("isCached()", () => {
        describe("identity only", () => {
            @EntityClass() class Foo { @Property.Id() id: string; }

            it("Foo(mo) should be cached via Foo(khaz,mo,dan)", () => {
                let cache = new QueryCache();

                let byKeys = new Query.ByIds({
                    entityType: Foo,
                    ids: ["khaz", "mo", "dan"]
                });

                let byMo = new Query.ById({
                    entityType: Foo,
                    id: "mo"
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });

            it("Foo(khaz,mo,dan) should be cached via Foo(mo), Foo(dan), Foo(khaz)", () => {
                let cache = new QueryCache();

                let byMo = new Query.ById({
                    entityType: Foo,
                    id: "mo"
                });

                let byDan = new Query.ById({
                    entityType: Foo,
                    id: "dan"
                });

                let byKhaz = new Query.ById({
                    entityType: Foo,
                    id: "khaz"
                });

                let byKeys = new Query.ByIds({
                    entityType: Foo,
                    ids: ["khaz", "mo", "dan"]
                });

                cache.merge(byMo);
                cache.merge(byDan);
                cache.merge(byKhaz);

                expect(cache.isCached(byKeys)).toBe(true);
            });

            it("Foo(mo,zul) should be cached via Foo(khaz,mo), Foo(zul,jin)", () => {
                let cache = new QueryCache();

                let byKhazMo = new Query.ByIds({
                    entityType: Foo,
                    ids: ["khaz", "mo"]
                });

                let byZulJin = new Query.ByIds({
                    entityType: Foo,
                    ids: ["zul", "jin"]
                });

                let byMoZul = new Query.ByIds({
                    entityType: Foo,
                    ids: ["mo", "zul"]
                });

                cache.merge(byKhazMo);
                cache.merge(byZulJin);

                expect(cache.isCached(byMoZul)).toBe(true);
            });
        });

        describe("w/ expansions", () => {
            @EntityClass() class Foo {
                @Property.Id() id: string;
                @Property.Children({ back: "parent", other: () => Bar }) children: Bar[];
            }

            @EntityClass() class Bar {
                @Property.Id() id: string;
                @Property.Reference({ key: "parentId", other: () => Foo }) parent: Foo;
            }

            it("Foo(mo)/children should be cached via Foo(khaz,mo,dan)/children", () => {
                let cache = new QueryCache();

                let byKeys = new Query.ByIds({
                    entityType: Foo,
                    ids: ["khaz", "mo", "dan"],
                    expand: `children`
                });

                let byMo = new Query.ById({
                    entityType: Foo,
                    id: "mo",
                    expand: `children`
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });
        });
    });
});
