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

    @Post("search")
    searchProducts(@Body() filter: ProductFilter): Observable<Product[]> {
        return from(this.repository.search(filter));
    }
}
