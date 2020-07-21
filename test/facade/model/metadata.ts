import { createProperty } from "src";
import { User } from "./user";

export class Metadata {
    createdAt: string = "";
    createdById: number = 0;
    createdBy = createProperty("createdBy", User, b => b.loadable(["optional"]));
    updatedAt: string | null = null;
    updatedById: number | null = null;
    updatedBy = createProperty("updatedBy", User, b => b.loadable(["optional"]));
}
