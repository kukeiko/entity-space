import {
    EntityQueryShape,
    EntitySelection,
    mergeSelections,
    packEntitySelection,
    subtractSelection,
} from "@entity-space/elements";
import { isNot } from "@entity-space/utils";
import { isEqual } from "lodash";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntitySourcing } from "../accepted-entity-sourcing";
import { DescribedEntitySourcing } from "../described-entity-sourcing";
import { EntitySource } from "../entity-source";
import { expandSourcedSelection } from "./expand-source-selection.fn";

function getBestAcceptedSourcing(
    sources: readonly EntitySource[],
    queryShape: EntityQueryShape,
): AcceptedEntitySourcing | undefined {
    const accepted = sources
        .map(source => source.accept(queryShape))
        .filter(isNot(false))
        .map((acceptedSourcing, index) => [acceptedSourcing, index] as const)
        .sort(([a, indexA], [b, indexB]) => {
            const uniqueCountDiff =
                b.getReshapedShape().getCriteriaUniqueCount() - a.getReshapedShape().getCriteriaUniqueCount();

            if (uniqueCountDiff !== 0) {
                return uniqueCountDiff;
            }

            const flattenCountDiff =
                a.getReshapedShape().getCriteriaFlattenCount() - b.getReshapedShape().getCriteriaFlattenCount();

            if (flattenCountDiff !== 0) {
                return flattenCountDiff;
            }

            const shapeA = a.getReshapedShape().getReshaped().getCriterionShape();
            const shapeB = b.getReshapedShape().getReshaped().getCriterionShape();

            if ((shapeA === undefined || shapeB === undefined) && shapeA !== shapeB) {
                return shapeA === undefined ? 1 : -1;
            }

            return indexA - indexB;
        });

    if (!accepted.length) {
        return undefined;
    }

    return accepted[0][0];
}

function expandSelectionAndAcceptAgain(
    queryShape: EntityQueryShape,
    accepted: AcceptedEntitySourcing,
    services: EntityServiceContainer,
): [AcceptedEntitySourcing, EntitySelection | undefined] {
    const expandedTargetSelection = expandSourcedSelection(
        services,
        queryShape.getSchema(),
        queryShape.getUnpackedSelection(),
    );

    if (!isEqual(queryShape.getUnpackedSelection(), expandedTargetSelection)) {
        const schema = queryShape.getSchema();
        const added = subtractSelection(expandedTargetSelection, queryShape.getUnpackedSelection());

        if (typeof added === "boolean") {
            throw new Error("bad library logic");
        }

        services
            .getTracing()
            .selectionGotExpanded(
                packEntitySelection(schema, queryShape.getUnpackedSelection()),
                packEntitySelection(schema, expandedTargetSelection),
                packEntitySelection(schema, added),
            );

        const acceptedAgain = accepted.getSource().accept(queryShape.with({ selection: expandedTargetSelection }));

        if (acceptedAgain) {
            return [acceptedAgain, expandedTargetSelection];
        }
    }

    return [accepted, undefined];
}

export function describeSourcing(
    services: EntityServiceContainer,
    queryShape: EntityQueryShape,
): DescribedEntitySourcing | false {
    const acceptedSourcings: AcceptedEntitySourcing[] = [];
    const sources = services.getSourcesFor(queryShape.getSchema());
    let nextQueryShape: EntityQueryShape | undefined = queryShape;
    let targetSelection = queryShape.getUnpackedSelection();

    while (true) {
        let bestAccepted = getBestAcceptedSourcing(sources, queryShape);

        if (bestAccepted === undefined) {
            break;
        }

        const [expandAccepted, expandedSelection] = expandSelectionAndAcceptAgain(queryShape, bestAccepted, services);

        if (expandedSelection) {
            targetSelection = mergeSelections([targetSelection, expandedSelection]);
        }

        acceptedSourcings.push(expandAccepted);
        nextQueryShape = expandAccepted.getReshapedShape().getOpenForCriteria();

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
