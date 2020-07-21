import { createProperty } from "src";

export class AuthorModel {
    id = createProperty("id", Number, b => b.loadable());
    name = createProperty("name", String, b => b.loadable(["optional"]));
}
