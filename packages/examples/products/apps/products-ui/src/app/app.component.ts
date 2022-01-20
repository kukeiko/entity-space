import { Component } from "@angular/core";
import {
    ArraySchema,
    Criterion,
    EntitySchema,
    EntitySourceGateway,
    Expansion,
    IEntitySchema,
    inRange,
    matches,
    Query,
    Workspace,
} from "@entity-space/core";
import { Product } from "@entity-space/examples/products/libs/products-model";
import { ProductEntitySource } from "./entity-sources/product.entity-source";

@Component({
    selector: "entity-space-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(private readonly productEntitySource: ProductEntitySource) {
        const brandSchema = new EntitySchema("brand");
        brandSchema.setKey("id");

        const productReviewSchema = new EntitySchema("product-review");
        productReviewSchema.setKey("id");
        productReviewSchema.addIndex("productId");

        const productSchema = new EntitySchema("product");
        productSchema.setKey("id");
        productSchema.addIndex("brandId");
        productSchema.addProperty("brand", brandSchema);
        productSchema.addRelation("brand", "brandId", "id");
        productSchema.addProperty("reviews", new ArraySchema(productReviewSchema));
        productSchema.addRelation("reviews", "id", "productId");

        this.productSchema = productSchema;
        this.brandSchema = brandSchema;

        const entitySourceGateway = new EntitySourceGateway();
        entitySourceGateway.addSource(this.productSchema, productEntitySource);
        this.gateway = entitySourceGateway;

        const workspace = new Workspace();
        workspace.setSource(entitySourceGateway);
        this.workspace = workspace;

        productEntitySource.schema_TMP = productSchema;
    }

    gateway: EntitySourceGateway;
    productSchema: IEntitySchema;
    brandSchema: IEntitySchema;
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

    async ngOnInit(): Promise<void> {
        this.productEntitySource
            .onQueryIssued()
            .subscribe(query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query]));
        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
    }

    async search(): Promise<void> {
        try {
            const criteria = this.uiFilterToCriteria();
            // [todo] consider allowing "false" as an expansion value
            const expansion: Expansion<Product> = {
                brand: this.includeBrand || void 0,
                reviews: this.includeReviews || void 0,
            };

            // [todo] dirty, but for now necessary
            if (expansion.reviews === void 0) {
                delete expansion.reviews;
            }

            if (expansion.brand === void 0) {
                delete expansion.brand;
            }

            const result = await this.workspace.query({
                entitySchema: this.productSchema,
                criteria,
                expansion,
            });

            if (result === false) {
                throw new Error(`query result from workspace unexpectedly is "false"`);
            }

            // [todo] get rid of cast
            this.products = result as Product[];
        } catch (error) {
            alert((error as any).message ?? error);
        }
    }

    clear(): void {
        this.queriesInWorkspaceCache = [];
        this.queriesIssuedAgainstApi = [];
        this.products = [];
        this.workspace.clearCache();
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
