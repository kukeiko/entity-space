import { EntityClass } from "../../../src";

@EntityClass({
    primaryKey: { name: "id" },
    primitives: { name: {} }
})
export class TagType {
    id: number;
    name: string;
}
