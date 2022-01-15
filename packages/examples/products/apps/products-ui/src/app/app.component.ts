import { Component } from "@angular/core";
import { Criterion, EntitySchema, IEntitySchema, inRange, matches, Query, Workspace } from "@entity-space/core";
import { Product } from "@entity-space/examples/products/libs/products-model";
import { ProductEntitySource } from "./entity-sources/product.entity-source";

@Component({
    selector: "entity-space-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(private readonly productEntitySource: ProductEntitySource) {
        const productSchema = new EntitySchema("product");
        productSchema.setKey("id");

        this.productSchema = productSchema;

        const workspace = new Workspace();
        workspace.addEntitySource(this.productSchema, this.productEntitySource);

        this.workspace = workspace;
    }

    productSchema: IEntitySchema;
    workspace: Workspace;
    queriesIssuedAgainstApi: Query[] = [];
    products: Product[] = [];

    minRating: string = "3";
    maxRating: string = "5";
    minPrice: string = "100";
    maxPrice: string = "200";

    async ngOnInit(): Promise<void> {
        this.productEntitySource.onQueryIssued().subscribe(query => this.queriesIssuedAgainstApi.push(query));
    }

    async search(): Promise<void> {
        try {
            const criteria = this.uiFilterToCriteria();
            this.products = await this.workspace.query({
                entitySchema: this.productSchema,
                criteria,
                expansion: {},
            });
        } catch (error) {
            alert((error as any).message ?? error);
        }
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
