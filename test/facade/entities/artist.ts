import { EntityClass, Property } from "../../../src";
import { Album } from "./album";

@EntityClass({
    primaryKey: { name: "id", args: {} },
    primitives: { name: {} },
    children: {
        albums: { back: "artist", other: () => Album }
    }
})
export class Artist {
    id: number = null;

    @Property.Primitive()
    age: number = null;
    name: string = null;
    albums: Album[] = [];

    constructor(args?: Partial<Artist>) {
        Object.assign(this, args || {});
    }
}
