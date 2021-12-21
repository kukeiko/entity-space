import {
    matches,
    inRange,
    InNumberRangeCriterion,
    Query,
    Expansion,
    or,
    Criterion,
    NamedCriteriaTemplate,
    reduceQueries,
} from "@entity-space/core";
import { Schema } from "../../src/core/entity/metadata/schema";
import { SchemaCatalog } from "../../src/core/entity/metadata/schema-catalog";
import { Workspace } from "../../src/core/entity/workspace";
import { Product, ProductFilter } from "./model";
import { ProductRepository } from "./repositories";

function mapCriteriaToProductFilters(productCriteria: Criterion): ProductFilter[] {
    const template = new NamedCriteriaTemplate({
        price: [InNumberRangeCriterion],
        rating: [InNumberRangeCriterion],
    });

    const [remapped, open] = productCriteria.remap([template]);

    if (remapped === false) {
        throw new Error(`failed to remap criterion`);
    }

    const filters: ProductFilter[] = [];

    for (const criterion of remapped) {
        const bag = criterion.getBag();
        const filter: ProductFilter = {};

        if (bag.price !== void 0) {
            filter.minPrice = bag.price.getFrom()?.value ?? void 0;
            filter.maxPrice = bag.price.getTo()?.value ?? void 0;
        }

        if (bag.rating !== void 0) {
            filter.minRating = bag.rating.getFrom()?.value ?? void 0;
            filter.maxRating = bag.rating.getTo()?.value ?? void 0;
        }

        filters.push(filter);
    }

    return filters;
}

async function loadFromApi(query: Query): Promise<Product[]> {
    console.log("[query-against-api]", query);
    // [todo] query.criteria should probably already be properly typed so that this "cast" is not necessary
    const productCriteria = query.criteria as any; //ObjectCriteria<Product>;
    const productFilters = mapCriteriaToProductFilters(productCriteria);
    console.log("[product filters]", productFilters);
    const repository = new ProductRepository();
    const allProducts = await Promise.all(productFilters.map(filter => repository.filter(filter)));
    const allProductsFlattened = allProducts.reduce((acc, value) => [...acc, ...value], []);
    console.log("[repository returned]", allProductsFlattened);

    return allProductsFlattened;
}

describe("how do we actually load data?", () => {
    it("simple resolve of a query", async () => {
        // we want all products priced between 100 and 200 with a rating of 3 to 5
        const price_100_to_200_rating_3_to_5: Query = {
            model: "product",
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: {},
        };

        const workspace = new Workspace(
            new SchemaCatalog([
                new Schema({
                    name: "product",
                    key: "id",
                    properties: {
                        id: { type: "number" },
                        name: { type: "string" },
                        price: { type: "number" },
                        rating: { type: "number" },
                    },
                }),
            ])
        );

        const executedQueries: Query[] = [];

        async function executeQuery(query: Query): Promise<Product[]> {
            const reduced = reduceQueries([query], executedQueries);
            const productsLoadedFromApi: Product[] = [];

            if (reduced === false) {
                productsLoadedFromApi.push(...(await loadFromApi(query)));
                executedQueries.push(query);
            } else {
                for (const reducedQuery of reduced) {
                    productsLoadedFromApi.push(...(await loadFromApi(reducedQuery)));
                    executedQueries.push(reducedQuery);
                }
            }

            if (productsLoadedFromApi.length > 0) {
                workspace.add(query.model, productsLoadedFromApi);
            }

            return workspace.query(query);
        }

        const products = await executeQuery(price_100_to_200_rating_3_to_5);

        console.log("products:", products);

        const price_100_to_300_rating_2_to_5: Query = {
            model: "product",
            criteria: or([
                matches<Product>({
                    price: inRange(100, 300),
                    rating: inRange(2, 5),
                }),
            ]),
            expansion: {},
        };

        const moreProducts = await executeQuery(price_100_to_300_rating_2_to_5);

        // [todo] returns duplicate results, need to fix what happens when atting same item twice to workspace
        console.log("[more products]:", moreProducts);
    });
});
