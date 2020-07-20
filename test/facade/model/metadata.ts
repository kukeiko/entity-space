import { User } from "./user";

export class Metadata {
    createdAt: string = "";
    createdById: number = 0;
    createdBy?: User;
    updatedAt: string | null = null;
    updatedById: number | null = null;
    updatedBy?: User | null;
}
