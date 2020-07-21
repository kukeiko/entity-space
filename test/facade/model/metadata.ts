import { Property } from "../../../src/advanced/property";
import { User } from "./user";

export class Metadata {
    createdAt: string = "";
    createdById: number = 0;
    createdBy = Property.create("createdBy", User, b => b.loadable(["optional"]));
    updatedAt: string | null = null;
    updatedById: number | null = null;
    updatedBy = Property.create("updatedBy", User, b => b.loadable(["optional"]));
}
