import { Expansion, Query } from "../elements";
import { EntityClass, getEntityMetadata, Property } from "../metadata";
import { Workspace } from "./workspace";

describe("workspace", () => {
    @EntityClass() class Foo {
        constructor(args?: Partial<Foo>) { Object.assign(this, args || {}); };
        @Property.Id() id: number = null;
        @Property.Primitive() string: string = null;
        @Property.Date() time: Date = null;
        @Property.Complex() complex: Object = null;

        @Property.Children({ back: "foo", other: () => Bar }) bars: Bar[] = [];

        @Property.Complex() bazIds: number[] = [];
        @Property.Collection({ keys: "bazIds", other: () => Baz }) bazs: Baz[] = [];
    }


    @EntityClass() class Bar {
        constructor(args?: Partial<Bar>) { Object.assign(this, args || {}); };
        @Property.Id({ dtoName: "Id" }) id: number = null;
        @Property.Primitive({ dtoName: "A" }) string: string = null;
        @Property.Date({ dtoName: "B" }) time: Date = null;
        @Property.Complex({ dtoName: "C" }) complex: Object = null;

        @Property.Key({ dtoName: "FooNr" }) fooId: number = null;
        @Property.Reference({ dtoName: "Foo", key: "fooId", other: () => Foo }) foo: Foo = null;

        @Property.Key({ dtoName: "BazNr" }) bazId: number = null;
        @Property.Reference({ dtoName: "Baz", key: "bazId", other: () => Baz }) baz: Baz = null;
    }

    @EntityClass() class Baz {
        constructor(args?: Partial<Baz>) { Object.assign(this, args || {}); };
        @Property.Id() id: number = null;
        @Property.Primitive() string: string = null;
        @Property.Date() time: Date = null;
        @Property.Complex() complex: Object = null;
    }

    it("???", () => {
        let ws = new Workspace();
        // let ws2 = new WorkspaceV2();
        let fooMetadata = getEntityMetadata(Foo);
        let barMetadata = getEntityMetadata(Bar);
        let bazMetadata = getEntityMetadata(Baz);
        let foos: Foo[] = [];
        let numRootEntities = 50;

        for (let i = 0; i < numRootEntities; ++i) {
            let foo = new Foo({
                id: i,
                string: "a".repeat(20),
                time: new Date(),
                complex: { numba: 1, flag: true, items: [1, 2, 3] }
            });

            for (let e = 0; e < 10; ++e) {
                foo.bars.push(new Bar({
                    id: (i * 10) + e,
                    string: "a".repeat(20),
                    time: new Date(),
                    complex: { numba: 20, data: { yes: "no" }, items: ["1", "2", "3"] },
                    fooId: foo.id,
                    bazId: (i * 10) + e,
                    baz: new Baz({
                        id: (i * 10) + e,
                        string: "a".repeat(20),
                        time: new Date(),
                        complex: { numba: 20, data: { yes: "no" }, items: ["1", "2", "3"] }
                    })
                }));
            }

            foo.bazIds = foo.bars.map(b => b.baz.id);
            foos.push(foo);
        }

        let exp = Expansion.parse(fooMetadata.entityType, `bars/baz`);
        ws.add(foos, fooMetadata, exp);

        let performanceTest = () => {
            let total = 0;
            let samples = 70;

            // foos[0].bars = [new Bar({ id: 39812374, fooId: 0 })];
            // ws2.add([foos[0]], fooMetadata, Expansion.parse(fooMetadata.entityType, `bars/baz`));

            for (let i = 0; i < samples; ++i) {
                let start = new Date();
                ws.execute(new Query.All({
                    entityType: Foo,
                    expand: `bazs,bars/baz`
                }));
                let end = new Date();
                let run = end.getTime() - start.getTime();

                total += run;

                // console.log(`${run}ms`)

                // if (i == 9) {
                //     setTimeout(() => console.log(ws.execute(new Query.All({
                //         entityType: Foo,
                //         expansions: `bazs,bars/baz`
                //     }))));
                // }
            }

            let avg = total / samples;

            console.log(`--------------------------`);
            console.log(`${avg.toFixed(2)}ms`);

            console.log(ws);
        };

        performanceTest();

        // let toBeRemoved: Foo[] = [];

        // for (let i = 0; i < 200; i += 2) {
        //     toBeRemoved.push(new Foo({ id: i }));
        // }

        // let start = new Date();
        // ws2.remove(toBeRemoved, fooMetadata, exp);
        // let time = new Date().getTime() - start.getTime();

        // console.log(`${time}ms`);
        // console.log(ws2);
    });
});
