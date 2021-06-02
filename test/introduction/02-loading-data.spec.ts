import { inRange, InRangeCriterion, ObjectCriteria, Query, Selection } from "src";
import { Product, ProductFilter } from "./model";
import { ProductRepository } from "./repositories";

// [todo] move to criteria folder
function isInRangeCriterion(x: unknown): x is InRangeCriterion {
    return (x as InRangeCriterion).op === "range";
}

fdescribe("how do we actually load data?", () => {
    it("simple resolve of a query", async () => {
        /**
         * [todo] implement loading some products with filter criteria
         */
        const basic_properties: Selection = {
            id: true,
            name: true,
            price: true,
            rating: true,
        };

        const price_100_to_200_rating_3_to_5_no_reviews: Query = {
            criteria: [
                {
                    price: [inRange([100, 200])],
                    rating: [inRange([3, 5])],
                },
            ],
            selection: {
                ...basic_properties,
            },
            // [todo] please ignore those 2 lines for now
            model: [],
            options: {} as any,
        };

        function mapCriteriaToProductFilters(productCriteria: ObjectCriteria<Product>): ProductFilter[] {
            const productFilters: ProductFilter[] = [];

            for (const criteria of productCriteria) {
                const supportedPriceCriteria = (criteria.price || []).filter(isInRangeCriterion);
                const supportedRatingCriteria = (criteria.rating || []).filter(isInRangeCriterion);

                for (const priceCriterion of supportedPriceCriteria) {
                    const priceFilter: ProductFilter = {};

                    // [todo] having to do a "typeof value == 'supported-type'" is annoying
                    if (priceCriterion.from !== void 0 && typeof priceCriterion.from.value === "number") {
                        priceFilter.minPrice = priceCriterion.from.value;
                    }

                    // [todo] having to do a "typeof value == 'supported-type'" is annoying
                    if (priceCriterion.to !== void 0 && typeof priceCriterion.to.value === "number") {
                        priceFilter.maxPrice = priceCriterion.to.value;
                    }

                    if (supportedRatingCriteria.length == 0) {
                        productFilters.push(priceFilter);
                    } else {
                        for (const ratingCriterion of supportedRatingCriteria) {
                            const priceAndRatingFilter = { ...priceFilter };

                            // [todo] having to do a "typeof value == 'supported-type'" is annoying
                            if (ratingCriterion.from !== void 0 && typeof ratingCriterion.from.value === "number") {
                                priceAndRatingFilter.minRating = ratingCriterion.from.value;
                            }

                            // [todo] having to do a "typeof value == 'supported-type'" is annoying
                            if (ratingCriterion.to !== void 0 && typeof ratingCriterion.to.value === "number") {
                                priceAndRatingFilter.maxRating = ratingCriterion.to.value;
                            }

                            productFilters.push(priceAndRatingFilter);
                        }
                    }
                }
            }

            return productFilters;
        }

        async function resolveProductQuery(query: Query): Promise<Product[]> {
            // [todo] query.criteria should probably already be properly typed so that this "cast" is not necessary
            const productCriteria = query.criteria as ObjectCriteria<Product>;
            const productFilters = mapCriteriaToProductFilters(productCriteria);

            const repository = new ProductRepository();
            const allProducts = await Promise.all(productFilters.map(filter => repository.filter(filter)));

            return allProducts.reduce((acc, value) => [...acc, ...value], []);
        }

        const products = await resolveProductQuery(price_100_to_200_rating_3_to_5_no_reviews);

        console.log(JSON.stringify(products));
    });
});
