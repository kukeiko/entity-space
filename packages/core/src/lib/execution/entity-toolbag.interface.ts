import { IEntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools.interface";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { IEntityTools } from "../entity/entity-tools.interface";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntitySelectionTools } from "../query/entity-selection-tools.interface";

export interface IEntityToolbag {
    getCriteriaTools(): IEntityCriteriaTools;
    getCriteriaShapeTools(): IEntityCriteriaShapeTools;
    getSelectionTools(): IEntitySelectionTools;
    getQueryTools(): IEntityQueryTools;
    getEntityTools(): IEntityTools;
}
