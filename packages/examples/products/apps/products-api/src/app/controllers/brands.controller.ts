import { Expansion } from "@entity-space/core";
import { Brand } from "@entity-space/examples/products/libs/products-model";
import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { BrandRepository } from "../repositories/brand-repository";

@Controller("brands")
export class BrandsController {
    constructor(private readonly repository: BrandRepository) {}

    @Get()
    getBrands(): Observable<Brand[]> {
        return from(this.repository.all());
    }

    @Get(":id")
    async byId(@Param("id", ParseIntPipe) id: number): Promise<Brand> {
        const brands = await this.repository.byIds([id]);
        const brand = brands.find(brand => brand.id === id);

        if (brand === void 0) {
            throw new NotFoundException();
        }

        return brand;
    }

    @Post(":id")
    async byIdExpanded(
        @Param("id", ParseIntPipe) id: number,
        @Body("expand") expand?: Expansion<Brand>
    ): Promise<Brand> {
        const brands = await this.repository.byIds([id]);
        const brand = brands.find(brand => brand.id === id);

        if (brand === void 0) {
            throw new NotFoundException();
        }

        if (expand !== void 0) {
            await this.repository.expand([brand], expand);
        }

        return brand;
    }
}
