import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";

export type ClippedEntitySelection = [string[], true | UnpackedEntitySelection];

export interface IEntitySelectionTools {
    clip(what: UnpackedEntitySelection, by: UnpackedEntitySelection): ClippedEntitySelection[];
}
