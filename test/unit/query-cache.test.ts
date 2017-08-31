import { EntityClass, Query, QueryCache, Property } from "../../src";

describe("query-cache", () => {
    describe("isCached()", () => {
        describe("identity only", () => {
            @EntityClass() class Foo { @Property.Id() id: string; }

            it("Foo(mo) should be cached via Foo(khaz,mo,dan)", () => {
                let cache = new QueryCache();

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entityType: Foo
                });

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entityType: Foo
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });

            it("Foo(khaz,mo,dan) should be cached via Foo(mo), Foo(dan), Foo(khaz)", () => {
                let cache = new QueryCache();

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entityType: Foo
                });

                let byDan = Query.ByIds({
                    ids: ["dan"],
                    entityType: Foo
                });

                let byKhaz = Query.ByIds({
                    ids: ["khaz"],
                    entityType: Foo
                });

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entityType: Foo
                });

                cache.merge(byMo);
                cache.merge(byDan);
                cache.merge(byKhaz);

                expect(cache.isCached(byKeys)).toBe(true);
            });

            it("Foo(khaz,zul) should be cached via Foo(khaz,mo), Foo(zul,jin)", () => {
                let cache = new QueryCache();

                let byKhazMo = Query.ByIds({
                    ids: ["khaz", "mo"],
                    entityType: Foo
                });

                let byZulJin = Query.ByIds({
                    ids: ["zul", "jin"],
                    entityType: Foo
                });

                let byKhazZul = Query.ByIds({
                    ids: ["khaz", "zul"],
                    entityType: Foo
                });

                cache.merge(byKhazMo);
                cache.merge(byZulJin);

                expect(cache.isCached(byKhazZul)).toBe(true);
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

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entityType: Foo,
                    expand: `children`
                });

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entityType: Foo,
                    expand: `children`
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });
        });
    });
});
