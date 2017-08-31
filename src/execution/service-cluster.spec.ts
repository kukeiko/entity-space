import { EntityClass, Property } from "../metadata";
import { ServiceCluster } from "./service-cluster";

describe("service-cluster", () => {
    @EntityClass()
    class Item {
        constructor(args?: Partial<Item>) { Object.assign(this, args || {}); }
        @Property.Id() id: number;
    }

    it("should not load more than once from service due to being cached", async done => {
        let sc = new ServiceCluster();
        let items = [new Item({ id: 1 }), new Item({ id: 2 })];
        let numLoadCalled = 0;

        sc.register(
            Item,
            {
                load: () => {
                    numLoadCalled++;
                    return Promise.resolve(items);
                }
            });

        try {
            await sc.loadAll(Item);
            await sc.loadAll(Item);
            await sc.loadAll(Item);

            expect(numLoadCalled).toEqual(1);
        } catch (error) {
            fail(error);
        }

        done();
    });

    it("should return by value, not by reference", async done => {
        let sc = new ServiceCluster();
        let items = [new Item({ id: 1 }), new Item({ id: 2 })];

        sc.register(Item, { load: () => Promise.resolve(items) });

        try {
            let loaded = await sc.loadAll(Item);

            loaded.forEach((item, i) => {
                expect(item).not.toBe(items[i]);
                expect(item).toEqual(items[i]);
            });
        } catch (error) {
            fail(error);
        }

        done();
    });
});
