import { Local } from "./local";
import { Navigation } from "./navigation";

export type Property = Local | Navigation;

export module Property {
    export type Locality = Property["locality"];
    export type Type = Property["type"];

    export function getName(p: Property, dto = false): string {
        if (dto && p.dtoName !== void 0) return p.dtoName;

        return p.name;
    }
}
