import { Entity } from "../lib/common/entity.type";
import { EntitySet } from "../lib/entity/data-structures/entity-set";
import { EntityStreamPacket } from "../lib/execution/entity-stream-packet";
import { IEntityQuery } from "../lib/query/entity-query.interface";
import { Product, ProductBlueprint, TestContentFacade, User, UserBlueprint } from "./content";
import { expectPacketEqual } from "./tools/expect-packet-equal.fn";

const LOG_PACKETS = false;
const LOG_TRACING = false;

describe("interceptors", () => {
    function createFacade({
        logPackets,
        logTracing,
    }: {
        logPackets?: boolean;
        logTracing?: boolean;
    } = {}): TestContentFacade {
        return new TestContentFacade()
            .enablePacketLogging(logPackets ?? LOG_PACKETS)
            .enableTracing(logTracing ?? LOG_TRACING);
    }

    function createExpectedPacket(query: IEntityQuery, entities: Entity[]): EntityStreamPacket {
        return new EntityStreamPacket({
            accepted: [query],
            payload: [new EntitySet({ query, entities })],
        });
    }

    it("should load all users", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2 }, { id: 3 }])
            .configureApi(api => api.withGetAllUsers());

        const query = facade.createQuery(UserBlueprint);
        const expected = createExpectedPacket(query, [{ id: 2 }, { id: 3 }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user by id", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2 }, { id: 7 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(UserBlueprint, { id: 2 }, { id: true });
        const expected = createExpectedPacket(query, [{ id: 2 }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user by id & hydrate one relation", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(UserBlueprint, { id: 2 }, { id: true, parentId: true, parent: { id: true } });
        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load two users by id with a hydrated relation that is also filtered by id", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }, { id: 3, parentId: 8 }, { id: 8 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(
            UserBlueprint,
            { id: [2, 3], parent: { id: 7 } },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load users with crriteria on relation only)", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }, { id: 3, parentId: 8 }, { id: 8 }])
            .configureApi(api => api.withGetUserById().withGetAllUsers());

        const query = facade.createQuery(
            UserBlueprint,
            { parent: { id: 7 } },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user with nested hydrated relations", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = createExpectedPacket(query, [
            {
                id: 2,
                parentId: 7,
                parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
            },
        ]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should hydrate one relation of a complex property", async () => {
        // arrange
        const product: Product = {
            id: 7,
            brandId: 64,
            name: "tasty waffles",
            price: 43,
            metadata: { createdAt: "", createdById: 100, updatedAt: "", updatedById: 200 },
        };
        const createdBy: User = { id: 100, name: "i created it" };
        const updatedBy: User = { id: 200, name: "and i updated it" };
        const result: Product = { ...product, metadata: { ...product.metadata!, createdBy, updatedBy } };

        const facade = createFacade()
            .setData("products", [product])
            .setData("users", [createdBy, updatedBy])
            .configureApi(api => api.withGetAllProducts().withGetUserById());

        const query = facade.createQuery(ProductBlueprint, undefined, {
            id: true,
            metadata: { createdAt: true, createdBy: { id: true, name: true }, updatedBy: { id: true, name: true } },
        });

        const expected = createExpectedPacket(query, [result]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });
});
