import { EntitySchema, EntitySelection } from "@entity-space/elements";
import { ODataExpansion } from "./odata";

export function toODataExpansion(schema: EntitySchema, selection: EntitySelection): ODataExpansion {
    const oDataExpansion: ODataExpansion = {};

    for (const [key, selected] of Object.entries(selection)) {
        if (!schema.isRelation(key)) {
            continue;
        }

        const property = schema.getRelation(key);
        const dtoName = property.getDtoName();

        if (selected === true) {
            oDataExpansion[dtoName] = true;
        } else {
            oDataExpansion[dtoName] = toODataExpansion(property.getRelatedSchema(), selected);

            if(!Object.keys(oDataExpansion[dtoName]).length) {
                oDataExpansion[dtoName] = true;
            }
        }
    }

    return oDataExpansion;
}
