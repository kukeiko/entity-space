import { EntityQueryShape, EntitySelection, packEntitySelection, subtractSelection } from "@entity-space/elements";
import { isNot } from "@entity-space/utils";
import { isEqual } from "lodash";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntitySourcing } from "../accepted-entity-sourcing";
import { EntitySource } from "../entity-source";
import { expandSourcedSelection } from "./expand-source-selection.fn";

export function getBestAcceptedSourcing(
    services: EntityServiceContainer,
    queryShape: EntityQueryShape,
    sources: readonly EntitySource[],
): [AcceptedEntitySourcing, EntitySelection | undefined] | undefined {
    const accepted = sources
        .map(source => source.accept(queryShape))
        .filter(isNot(false))
        .sort((a, b) => {
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

            return a.getReshapedShape().getReshaped().getCriterionShape() === undefined ? 1 : -1;
        });

    if (!accepted.length) {
        return undefined;
    }

    const bestAccepted = accepted[0];
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

        const accepted = bestAccepted
            .getSource()
            .accept(
                new EntityQueryShape(
                    queryShape.getSchema(),
                    expandedTargetSelection,
                    queryShape.getCriterionShape(),
                    queryShape.getParametersSchema(),
                ),
            );

        if (accepted) {
            return [accepted, expandedTargetSelection];
        }
    }

    return [accepted[0], undefined];
}
