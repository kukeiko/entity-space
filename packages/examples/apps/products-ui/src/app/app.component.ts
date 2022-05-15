import { Component } from "@angular/core";
import { EntitySourceGateway, ExpansionObject, Query, Workspace } from "@entity-space/core";
import { Criterion, inRange, matches } from "@entity-space/criteria";
import { Product, ProductsSchemaCatalog } from "@entity-space/examples/products/libs/products-model";
import { merge } from "rxjs";
import { BrandEntitySource } from "./entity-sources/brand.entity-source";
import { ProductEntitySource } from "./entity-sources/product.entity-source";
import { UserEntitySource } from "./entity-sources/user.entity-source";

@Component({
    selector: "entity-space-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(
        private readonly productEntitySource: ProductEntitySource,
        private readonly brandEntitySource: BrandEntitySource,
        private readonly userEntitySource: UserEntitySource,
        private readonly schemaCatalog: ProductsSchemaCatalog
    ) {
        this.gateway = new EntitySourceGateway();
        this.gateway.addSource(productEntitySource.getEntitySchema(), productEntitySource);
        this.gateway.addSource(brandEntitySource.getEntitySchema(), brandEntitySource);
        this.gateway.addSource(userEntitySource.getEntitySchema(), userEntitySource);

        this.workspace = new Workspace();
        this.workspace.setSource(this.gateway);
    }

    gateway: EntitySourceGateway;
    workspace: Workspace;
    queriesIssuedAgainstApi: Query[] = [];
    queriesInWorkspaceCache: Query[] = [];
    products: Product[] = [];

    displayedQueryColumns: string[] = ["schema", "criteria", "expansion"];

    minRating: string = "3";
    maxRating: string = "5";
    minPrice: string = "100";
    maxPrice: string = "200";

    includeBrand = false;
    includeReviews = false;
    includeBrandReviews = false;
    includeBrandReviewAuthors = false;

    async ngOnInit(): Promise<void> {
        merge(
            this.productEntitySource.onQueryIssued(),
            this.brandEntitySource.onQueryIssued(),
            this.userEntitySource.onQueryIssued()
        ).subscribe(query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query]));

        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
    }

    async search(): Promise<void> {
        try {
            const criteria = this.uiFilterToCriteria();
            // [todo] consider allowing "false" as an expansion value
            const expansion: ExpansionObject<Product> = {
                brand: this.includeBrand
                    ? this.includeBrandReviews
                        ? { reviews: this.includeBrandReviewAuthors ? { author: true } : true }
                        : true
                    : void 0,
                reviews: this.includeReviews || void 0,
            };

            // [todo] dirty, but for now necessary
            if (expansion.reviews === void 0) {
                delete expansion.reviews;
            }

            if (expansion.brand === void 0) {
                delete expansion.brand;
            }

            // [todo] i added the matches({ id: inSet([1, 2, 3]) }) to test remapping criteria
            // resulting in multiple API calls, remove it and add as filter option to UI
            const query = new Query(
                this.schemaCatalog.getProductSchema(),
                // or(criteria, matches({ id: inSet([1, 2, 3]) })),
                criteria,
                expansion
            );

            const result = await this.workspace.query(query);

            if (result === false) {
                throw new Error(`query result from workspace unexpectedly is "false"`);
            }

            // [todo] get rid of cast
            this.products = result
                .map(queried => queried.getEntities())
                .reduce((acc, value) => [...acc, ...value], []) as Product[];
        } catch (error) {
            alert((error as any).message ?? error);
        }
    }

    clear(): void {
        this.queriesInWorkspaceCache = [];
        this.queriesIssuedAgainstApi = [];
        this.products = [];
        this.workspace.clear();
    }

    uiFilterToCriteria(): Criterion {
        const toIntOrUndefined = (value: string): number | undefined => {
            const parsed = parseInt(value);

            return isNaN(parsed) ? void 0 : parsed;
        };

        const minPrice = toIntOrUndefined(this.minPrice);
        const maxPrice = toIntOrUndefined(this.maxPrice);
        const minRating = toIntOrUndefined(this.minRating);
        const maxRating = toIntOrUndefined(this.maxRating);

        return matches<Product>({
            price: inRange(minPrice, maxPrice),
            rating: inRange(minRating, maxRating),
        });
    }
}
