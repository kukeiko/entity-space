import { EntityQueryShape, mergeSelections } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntitySourcing } from "../accepted-entity-sourcing";
import { DescribedEntitySourcing } from "../described-entity-sourcing";
import { getBestAcceptedSourcing } from "./get-best-accepted-sourcing.fn";

export function describeSourcing(
    services: EntityServiceContainer,
    queryShape: EntityQueryShape,
): DescribedEntitySourcing | false {
    const acceptedSourcings: AcceptedEntitySourcing[] = [];
    const sources = services.getSourcesFor(queryShape.getSchema());
    let nextQueryShape: EntityQueryShape | undefined = queryShape;
    let targetSelection = queryShape.getUnpackedSelection();

    while (true) {
        const bestAccepted = getBestAcceptedSourcing(services, nextQueryShape, sources);

        if (!bestAccepted) {
            break;
        }

        if (bestAccepted[1]) {
            targetSelection = mergeSelections([targetSelection, bestAccepted[1]]);
        }

        acceptedSourcings.push(bestAccepted[0]);
        nextQueryShape = bestAccepted[0].getReshapedShape().getOpenForCriteria();

        if (!nextQueryShape) {
            break;
        }
    }

    if (!acceptedSourcings.length) {
        return false;
    }

    return new DescribedEntitySourcing(
        queryShape.getSchema(),
        targetSelection,
        acceptedSourcings,
        queryShape.getParametersSchema(),
    );
}
