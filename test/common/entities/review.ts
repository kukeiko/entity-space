import { Entity } from "../../../src";

@Entity()
export class Review {
    @Entity.PrimaryKey()
    get globalId(): string {
        return `${this.id}@${this.systemId}`;
    }

    @Entity.Primitive()
    id: string = null;

    @Entity.Primitive()
    systemId: number = null;

    constructor(args?: Partial<Review>) {
        Object.assign(this, args || {});
    }
}
