import { Entity, EntityTypeMetadata } from "src";

export class User extends Entity<User, typeof User> {
    static getMetadata(): EntityTypeMetadata<User> {
        return {} as any;
    }

    id: number = 0;
    name: string = "";
}
