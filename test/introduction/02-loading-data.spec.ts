import { criteria, inRange, Query, Selection } from "src";
import { Product, ProductFilter } from "./model";
import { ProductRepository } from "./repositories";

xdescribe("how do we actually load data?", () => {
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
            criteria: criteria([
                {
                    price: inRange(100, 200),
                    rating: inRange(3, 5),
                },
            ]),
            selection: {
                ...basic_properties,
            },
            // [todo] please ignore those 2 lines for now
            model: [],
            options: {} as any,
        };

        // function mapCriteriaToProductFilters(productCriteria: ObjectCriteria<Product>): ProductFilter[] {
        function mapCriteriaToProductFilters(productCriteria: any): ProductFilter[] {
            const productFilters: ProductFilter[] = [];

            // for (const criteria of productCriteria) {
            //     const supportedPriceCriteria = (criteria.price || []).filter(isInRangeNumberCriterion);
            //     const supportedRatingCriteria = (criteria.rating || []).filter(isInRangeNumberCriterion);

            //     for (const priceCriterion of supportedPriceCriteria) {
            //         const priceFilter: ProductFilter = {
            //             minPrice: priceCriterion.from?.value,
            //             maxPrice: priceCriterion.to?.value,
            //         };

            //         if (supportedRatingCriteria.length == 0) {
            //             productFilters.push(priceFilter);
            //         } else {
            //             for (const ratingCriterion of supportedRatingCriteria) {
            //                 productFilters.push({ ...priceFilter, minRating: ratingCriterion.from?.value, maxRating: ratingCriterion.to?.value });
            //             }
            //         }
            //     }
            // }

            return productFilters;
        }

        async function resolveProductQuery(query: Query): Promise<Product[]> {
            // [todo] query.criteria should probably already be properly typed so that this "cast" is not necessary
            const productCriteria = query.criteria as any; //ObjectCriteria<Product>;
            const productFilters = mapCriteriaToProductFilters(productCriteria);

            const repository = new ProductRepository();
            const allProducts = await Promise.all(productFilters.map(filter => repository.filter(filter)));

            return allProducts.reduce((acc, value) => [...acc, ...value], []);
        }

        const products = await resolveProductQuery(price_100_to_200_rating_3_to_5_no_reviews);

        console.log(JSON.stringify(products));
    });
});
