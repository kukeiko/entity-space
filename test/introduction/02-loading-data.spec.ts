import { matches, inRange, InNumberRangeCriterion, Query, Selection, EntityCriterion, or, ValueCriterion, OrCombinedValueCriteria } from "src";
import { Product, ProductFilter } from "./model";
import { ProductRepository } from "./repositories";

describe("how do we actually load data?", () => {
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

        // we want all products priced between 100 and 200 with a rating of 3 to 5
        const productCriteria = or([
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
        ]);

        const query: Query = {
            criteria: productCriteria,
            selection: {
                ...basic_properties,
            },
            // [todo] please ignore those 2 lines for now
            model: [],
            options: {} as any,
        };

        function mapCriteriaToProductFilters(productCriteria: ValueCriterion): ProductFilter[] {
            // [todo] hacky workaround to satisfy compiler; i don't want to comment out the current remapping
            // functionality so i still see the method uses here in case i do "find all references"
            function isProductEntityCriteria(x: any): x is OrCombinedValueCriteria<Product> {
                return x instanceof OrCombinedValueCriteria;
            }

            function isProductEntityCriterion(x: any): x is EntityCriterion<Product> {
                return x instanceof EntityCriterion;
            }

            if (!isProductEntityCriteria(productCriteria)) {
                throw new Error("criteria unexpectedly not or-combined criteria");
            }

            const remapped = productCriteria
                .getItems()
                .filter(isProductEntityCriterion)
                .map(criterion =>
                    criterion.remap(() => ({
                        price: InNumberRangeCriterion,
                        rating: InNumberRangeCriterion,
                    }))
                );

            const filters: ProductFilter[] = [];

            for (const criteria of remapped) {
                for (const criterion of criteria) {
                    const filter: ProductFilter = {};

                    if (criterion.price !== void 0) {
                        filter.minPrice = criterion.price.getFrom()?.value ?? void 0;
                        filter.maxPrice = criterion.price.getTo()?.value ?? void 0;
                    }

                    if (criterion.rating !== void 0) {
                        filter.minRating = criterion.rating.getFrom()?.value ?? void 0;
                        filter.maxRating = criterion.rating.getTo()?.value ?? void 0;
                    }

                    filters.push(filter);
                }
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
