import { inRange, InRangeCriterion, ObjectCriteria, Query, Selection } from "src";
import { Product, ProductFilter } from "./model";

// [todo] move to criteria folder
function isInRangeCriterion(x: unknown): x is InRangeCriterion {
    return (x as InRangeCriterion).op === "range";
}

describe("how do we actually load data?", () => {
    it("simple resolve of a query", () => {
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

        async function resolveProductQuery(query: Query): Promise<Product[]> {
            // [todo] query.criteria should probably already be properly typed so that this "cast" is not necessary
            const productCriteria = query.criteria as ObjectCriteria<Product>;

            for (const criteria of productCriteria) {
                const supportedPriceCriteria = (criteria.price || []).filter(isInRangeCriterion);
                const supportedRatingCriteria = criteria.rating || [].filter(isInRangeCriterion);

                for (const priceCriterion of supportedPriceCriteria) {
                    for (const ratingCriterion of supportedRatingCriteria) {
                        const productFilter: ProductFilter = {};

                        if (priceCriterion.from !== void 0) {
                            // [todo] stopped here because i noticed not having value type of criterion narrowed down is a bad thing
                            // that i want to fix before i continue here
                            // productFilter.minPrice = priceCriterion.from.value;
                        }
                    }
                }
            }

            return [];
        }
    });
});
