import { createProperty } from "src";
import { User } from "./user.model";

export class MetadataModel {
    createdAt: string = "";
    createdById: number = 0;
    createdBy = createProperty("createdBy", User, b => b.loadable(["optional"]));
    updatedAt: string | null = null;
    updatedById: number | null = null;
    updatedBy = createProperty("updatedBy", User, b => b.loadable(["optional"]));
}
