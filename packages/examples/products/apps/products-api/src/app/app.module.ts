import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BrandsController } from "./controllers/brands.controller";
import { ProductsController } from "./controllers/products.controller";
import { UsersController } from "./controllers/users.controller";
import { BrandRepository } from "./repositories/brand-repository";
import { BrandReviewRepository } from "./repositories/brand-review-repository";
import { ProductRepository } from "./repositories/product-repository";
import { ProductReviewRepository } from "./repositories/product-review-repository";
import { UserRepository } from "./repositories/user-repository";

@Module({
    imports: [],
    controllers: [AppController, ProductsController, BrandsController, UsersController],
    providers: [
        AppService,
        ProductRepository,
        BrandRepository,
        ProductReviewRepository,
        BrandReviewRepository,
        UserRepository,
    ],
})
export class AppModule {}
