import {
    Criterion,
    InNumberRangeCriterion,
    inRange,
    matches,
    NamedCriteriaTemplate,
    or,
    Query,
} from "@entity-space/core";
import { IEntitySource } from "../../lib/entity/entity-source.interface";
import { QueriedEntities } from "../../lib/entity/queried-entities";
import { Workspace } from "../../lib/entity/workspace";
import { EntitySchema } from "../../lib/schema/entity-schema";
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
        const productSchema = new EntitySchema("product");
        productSchema.setKey("id");

        // we want all products priced between 100 and 200 with a rating of 3 to 5
        const price_100_to_200_rating_3_to_5: Query = {
            entitySchema: productSchema,
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: {},
        };

        const productSource: IEntitySource = {
            async query(query: Query): Promise<QueriedEntities> {
                const products = await loadFromApi(query);

                // [todo] should actually return query that was effectively used (i.e. what API supports),
                // and not the one that was passed in
                return new QueriedEntities(query, products);
            },
        };

        const workspace = new Workspace();
        workspace.addEntitySource(productSchema, productSource);

        const products = await workspace.query(price_100_to_200_rating_3_to_5);
        console.log("[products]:", products);

        const price_100_to_300_rating_2_to_5: Query = {
            entitySchema: productSchema,
            criteria: or([
                matches<Product>({
                    price: inRange(100, 300),
                    rating: inRange(2, 5),
                }),
            ]),
            expansion: {},
        };

        const moreProducts = await workspace.query(price_100_to_300_rating_2_to_5);

        // [todo] returns duplicate results, need to fix what happens when adding same item twice to workspace
        console.log("[more products]:", moreProducts);
    });
});
