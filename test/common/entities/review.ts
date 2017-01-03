import { Entity } from "../../../src";

@Entity()
export class Review {
    @Entity.PrimaryKey()
    id: string;

    @Entity.Primitive()
    text: string;
}
