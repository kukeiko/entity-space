import { EntityClass, Property } from "../../../src";

@EntityClass()
export class Review {
    @Property.Id()
    get globalId(): string {
        return `${this.id}@${this.systemId}`;
    }

    @Property.Primitive()
    id: string = null;

    @Property.Primitive()
    systemId: number = null;

    constructor(args?: Partial<Review>) {
        Object.assign(this, args || {});
    }
}
