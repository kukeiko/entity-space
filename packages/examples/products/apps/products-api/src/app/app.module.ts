import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductsController } from "./controllers/products.controller";
import { ProductRepository } from "./repositories/product-repository";

@Module({
    imports: [],
    controllers: [AppController, ProductsController],
    providers: [AppService, ProductRepository],
})
export class AppModule {}
