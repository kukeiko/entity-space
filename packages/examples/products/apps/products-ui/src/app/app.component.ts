import { Component } from "@angular/core";
import {
    ArraySchema,
    EntitySchema,
    EntitySourceGateway,
    Expansion,
    IEntitySchema,
    Query,
    Workspace,
} from "@entity-space/core";
import { Criterion, inRange, matches } from "@entity-space/criteria";
import { Product } from "@entity-space/examples/products/libs/products-model";
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
        private readonly userEntitySource: UserEntitySource
    ) {
        const userSchema = new EntitySchema("user");
        userSchema.setKey("id");

        const brandSchema = new EntitySchema("brand");
        brandSchema.setKey("id");

        const brandReviewSchema = new EntitySchema("brand-review");
        brandReviewSchema.setKey("id");
        brandReviewSchema.addIndex("brandId");
        brandReviewSchema.addIndex("authorId");
        brandReviewSchema.addProperty("author", userSchema);
        brandReviewSchema.addRelation("author", "authorId", "id");

        brandSchema.addProperty("reviews", new ArraySchema(brandReviewSchema));
        brandSchema.addRelation("reviews", "id", "brandId");

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
        entitySourceGateway.addSource(this.brandSchema, brandEntitySource);
        entitySourceGateway.addSource(userSchema, userEntitySource);
        this.gateway = entitySourceGateway;

        const workspace = new Workspace();
        workspace.setSource(entitySourceGateway);
        this.workspace = workspace;

        productEntitySource.schema_TMP = productSchema;
        brandEntitySource.schema_TMP = brandSchema;
        userEntitySource.schema_TMP = userSchema;
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
    includeBrandReviews = false;
    includeBrandReviewAuthors = false;

    async ngOnInit(): Promise<void> {
        merge(this.productEntitySource.onQueryIssued(), this.brandEntitySource.onQueryIssued()).subscribe(
            query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query])
        );

        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
    }

    async search(): Promise<void> {
        try {
            const criteria = this.uiFilterToCriteria();
            // [todo] consider allowing "false" as an expansion value
            const expansion: Expansion<Product> = {
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

            const result = await this.workspace.query({
                entitySchema: this.productSchema,
                criteria,
                expansion,
            });

            if (result === false) {
                throw new Error(`query result from workspace unexpectedly is "false"`);
            }

            // [todo] get rid of cast
            this.products = result.getEntities() as Product[];
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
