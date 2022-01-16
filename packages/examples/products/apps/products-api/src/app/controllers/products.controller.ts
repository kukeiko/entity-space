import { Expansion } from "@entity-space/core";
import { Product, ProductFilter } from "@entity-space/examples/products/libs/products-model";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { ProductRepository } from "../repositories/product-repository";

@Controller("products")
export class ProductsController {
    constructor(private readonly repository: ProductRepository) {}

    @Get()
    getProducts(): Observable<Product[]> {
        return from(this.repository.all());
    }

    @Post()
    getProductsExpanded(@Body() expand?: Expansion): Observable<Product[]> {
        return from(this.repository.all(expand));
    }

    @Post("search")
    searchProducts(@Body("filter") filter: ProductFilter, @Body("expand") expand?: Expansion): Observable<Product[]> {
        return from(this.repository.search(filter, expand));
    }
}
