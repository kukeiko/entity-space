import {
    matches,
    inRange,
    InNumberRangeCriterion,
    Query,
    Expansion,
    or,
    Criterion,
    NamedCriteriaTemplate,
} from "@entity-space/core";
import { Product, ProductFilter } from "./model";
import { ProductRepository } from "./repositories";

xdescribe("how do we actually load data?", () => {
    it("simple resolve of a query", async () => {
        /**
         * [todo] implement loading some products with filter criteria
         */
        const basic_properties: Expansion = {
            id: true,
            name: true,
            price: true,
            rating: true,
        };

        // we want all products priced between 100 and 200 with a rating of 3 to 5
        const productCriteria = or([
            matches<Product>({
                // price: inRange(100, 200),
                price: or(inRange(100, 200), inRange(400, 800)),
                rating: inRange(3, 5),
            }),
        ]);

        const query: Query = {
            model: "TODO",
            criteria: productCriteria,
            expansion: {
                ...basic_properties,
            },
        };

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

        async function resolveProductQuery(query: Query): Promise<Product[]> {
            // [todo] query.criteria should probably already be properly typed so that this "cast" is not necessary
            const productCriteria = query.criteria as any; //ObjectCriteria<Product>;
            const productFilters = mapCriteriaToProductFilters(productCriteria);
            console.log("product filters", JSON.stringify(productFilters));
            const repository = new ProductRepository();
            const allProducts = await Promise.all(productFilters.map(filter => repository.filter(filter)));

            return allProducts.reduce((acc, value) => [...acc, ...value], []);
        }

        const products = await resolveProductQuery(query);

        console.log("products:", JSON.stringify(products));
    });
});
