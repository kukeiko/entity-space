import { User } from "@entity-space/examples/libs/products-model";
import { Controller, Get, NotFoundException, Param, ParseIntPipe } from "@nestjs/common";
import { from, Observable } from "rxjs";
import { UserRepository } from "../repositories/user-repository";

@Controller("users")
export class UsersController {
    constructor(private readonly repository: UserRepository) {}

    @Get()
    all(): Observable<User[]> {
        return from(this.repository.all());
    }

    @Get(":id")
    async byId(@Param("id", ParseIntPipe) id: number): Promise<User> {
        const brands = await this.repository.byIds([id]);
        const brand = brands.find(brand => brand.id === id);

        if (brand === void 0) {
            throw new NotFoundException();
        }

        return brand;
    }
}
