import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySelection } from "./entity-selection";

export type ClippedEntitySelection = [string[], true | UnpackedEntitySelection];

export interface IEntitySelectionTools {
    toDestructurable(): IEntitySelectionTools;
    clip(what: UnpackedEntitySelection, by: UnpackedEntitySelection): ClippedEntitySelection[];
    getRelatedSchemas(selection: EntitySelection): IEntitySchema[];
}
