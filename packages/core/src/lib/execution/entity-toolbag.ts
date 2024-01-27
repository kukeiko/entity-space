import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { IEntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntityTools } from "../entity/entity-tools";
import { IEntityTools } from "../entity/entity-tools.interface";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { EntitySelectionTools } from "../query/entity-selection-tools";
import { IEntitySelectionTools } from "../query/entity-selection-tools.interface";
import { IEntityToolbag } from "./entity-toolbag.interface";

export class EntityToolbag implements IEntityToolbag {
    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly criteriaShapeTools: IEntityCriteriaShapeTools = new EntityCriteriaShapeTools({
        criteriaTools: this.criteriaTools,
    });
    private readonly selectionTools: IEntitySelectionTools = new EntitySelectionTools();
    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });
    private readonly entityTools: IEntityTools = new EntityTools();

    getCriteriaTools(): IEntityCriteriaTools {
        return this.criteriaTools;
    }

    getCriteriaShapeTools(): IEntityCriteriaShapeTools {
        return this.criteriaShapeTools;
    }

    getSelectionTools(): IEntitySelectionTools {
        return this.selectionTools;
    }

    getQueryTools(): IEntityQueryTools {
        return this.queryTools;
    }

    getEntityTools(): IEntityTools {
        return this.entityTools;
    }
}
