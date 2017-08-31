import { EntityClass } from "../../../src";

@EntityClass({
    name: "TagType",
    primaryKey: { name: "id" },
    primitives: { name: {} }
})
export class TagType {
    id: number;
    name: string;
}
