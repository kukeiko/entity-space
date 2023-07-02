import { lastValueFrom } from "rxjs";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityQueryTracing } from "../../lib/execution/entity-query-tracing";
import { IEntityStreamInterceptor } from "../../lib/execution/interceptors/entity-stream-interceptor.interface";
import { LogPacketsInterceptor } from "../../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { SchemaRelationBasedHydrator } from "../../lib/execution/interceptors/schema-relation-based-hydrator";
import { runInterceptors } from "../../lib/execution/run-interceptors.fn";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { Brand, Product, ProductBlueprint, TestContentDatabase, TestContentEntityApi, User } from "../content";
import { TestContentCatalog } from "../content/test-content-catalog";

describe("playground: interceptors", () => {
    const criteriaTools = new EntityCriteriaTools();
    const queryTools = new EntityQueryTools({ criteriaTools });

    jest.setTimeout(10000000);

    fit("should allow putting two hydrators in sequence", async () => {
        // arrange
        const createdBy: User = { id: 100, name: "i created it" };
        const updatedBy: User = { id: 200, name: "and i updated it" };

        const brand: Brand = {
            id: 2,
            name: "Soaky Sponges INC.",
            metadata: { createdAt: "", createdById: createdBy.id, updatedAt: "", updatedById: updatedBy.id },
        };

        const product: Product = {
            id: 1,
            brandId: brand.id,
            name: "soaked sponges",
            price: 100,
            metadata: { createdAt: "", createdById: 0, updatedAt: "", updatedById: 0 },
        };

        const repository = new TestContentDatabase({
            brands: [brand],
            products: [product],
            users: [createdBy, updatedBy],
        });

        const catalog = new TestContentCatalog();
        const tracing = new EntityQueryTracing();
        const canLoadProductsApi = new TestContentEntityApi(repository, catalog, tracing).withGetAllProducts();
        const canLoadBrandsApi = new TestContentEntityApi(repository, catalog, tracing).withGetBrandById();
        const canLoadUsersApi = new TestContentEntityApi(repository, catalog, tracing).withGetUserById();
        const canHydrateUsersHydrator = new SchemaRelationBasedHydrator(tracing, [canLoadUsersApi]);
        const canHydrateBrandsHydrator = new SchemaRelationBasedHydrator(tracing, [
            canLoadBrandsApi,
            // comment below line out to see that putting hydrators in sequence doesn't work yet
            // canHydrateUsersHydrator,
        ]);

        const logEach = false;
        const logFinal = true;
        // tracing.enableConsole();

        (canHydrateBrandsHydrator as any).name = "canHydrateBrandsHydrator";
        (canHydrateUsersHydrator as any).name = "canHydrateUsersHydrator";

        const interceptors: IEntityStreamInterceptor[] = [
            canLoadProductsApi,
            // new LogPacketsInterceptor({ logEach }),
            canHydrateBrandsHydrator,
            new LogPacketsInterceptor({ logEach }),
            canHydrateUsersHydrator,
            new MergePacketsTakeLastInterceptor(),
            new LogPacketsInterceptor({ logFinal }),
        ];

        const productSchema = catalog.resolve(ProductBlueprint);
        const selection: UnpackedEntitySelection<Product> = {
            id: true,
            name: true,
            price: true,
            brandId: true,
            brand: {
                id: true,
                name: true,
                metadata: {
                    createdAt: true,
                    createdById: true,
                    updatedAt: true,
                    updatedById: true,
                    createdBy: { id: true, name: true },
                    updatedBy: { id: true, name: true },
                },
            },
        };
        const query = queryTools.createQuery({ entitySchema: productSchema, selection });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
    });
});
