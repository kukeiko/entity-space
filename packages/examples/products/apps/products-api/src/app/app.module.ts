import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductsController } from "./controllers/products.controller";
import { BrandRepository } from "./repositories/brand-repository";
import { ProductRepository } from "./repositories/product-repository";
import { ProductReviewRepository } from "./repositories/product-review-repository";

@Module({
    imports: [],
    controllers: [AppController, ProductsController],
    providers: [AppService, ProductRepository, BrandRepository, ProductReviewRepository],
})
export class AppModule {}
