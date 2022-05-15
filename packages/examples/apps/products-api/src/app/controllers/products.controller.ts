import { ExpansionObject } from "@entity-space/core";
import { Product, ProductFilter } from "@entity-space/examples/libs/products-model";
import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { ProductRepository } from "../repositories/product-repository";

@Controller("products")
export class ProductsController {
    constructor(private readonly repository: ProductRepository) {}

    @Get()
    getProducts(): Observable<Product[]> {
        return from(this.repository.all());
    }

    @Get(":id")
    async byId(@Param("id", ParseIntPipe) id: number): Promise<Product> {
        const products = await this.repository.byIds([id]);
        const product = products.find(brand => brand.id === id);

        if (product === void 0) {
            throw new NotFoundException();
        }

        return product;
    }

    @Post()
    getProductsExpanded(@Body() expand?: ExpansionObject): Observable<Product[]> {
        return from(this.repository.all(expand));
    }

    @Post("search")
    searchProducts(
        @Body("filter") filter: ProductFilter,
        @Body("expand") expand?: ExpansionObject<Product>
    ): Observable<Product[]> {
        return from(this.repository.search(filter, expand));
    }
}
