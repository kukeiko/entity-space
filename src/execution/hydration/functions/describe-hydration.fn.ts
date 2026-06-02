import { mergeSelections, packEntitySelection, selectionToString, subtractSelection } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntitySourcingState } from "../../sourcing/entity-sourcing-state.interface";
import { expandSourcedSelection } from "../../sourcing/functions/expand-source-selection.fn";
import { AcceptedEntityHydration } from "../accepted-entity-hydration";
import { DescribedEntityHydration } from "../described-entity-hydration";
import { getHydrators } from "./get-hydrators.fn";

export function describeHydration(
    services: EntityServiceContainer,
    sourcing: EntitySourcingState,
): DescribedEntityHydration | false {
    const schema = sourcing.getSchema();
    const parametersSchema = sourcing.getParametersSchema();
    const targetSelection = expandSourcedSelection(services, schema, sourcing.getTargetSelection());
    let availableSelection = sourcing.getAvailableSelection();
    let openSelection = subtractSelection(targetSelection, availableSelection);

    if (typeof openSelection === "boolean") {
        return false;
    } else if (openSelection === undefined) {
        throw new Error("openSelection was unexpectedly undefined");
    }

    const acceptedHydrations: AcceptedEntityHydration[][] = [];
    const hydrators = getHydrators(services, schema, targetSelection);

    while (true) {
        const currentAcceptedHydrations: AcceptedEntityHydration[] = [];

        for (const hydrator of hydrators) {
            const accepted = hydrator.accept(schema, availableSelection, openSelection, parametersSchema);

            if (accepted === false) {
                continue;
            }

            currentAcceptedHydrations.push(accepted);
            const nextOpenSelection = subtractSelection(openSelection, accepted.getAcceptedSelection());

            services
                .getTracing()
                .hydratorAcceptedSelection(
                    hydrator,
                    packEntitySelection(schema, openSelection),
                    packEntitySelection(schema, accepted.getAcceptedSelection()),
                    typeof nextOpenSelection === "boolean"
                        ? nextOpenSelection
                        : packEntitySelection(schema, nextOpenSelection),
                );

            if (nextOpenSelection === false) {
                throw new Error(
                    `bad hydrator implementation: accepted selection ${selectionToString(accepted.getAcceptedSelection())} is not subtractable from ${selectionToString(openSelection)}`,
                );
            } else if (nextOpenSelection === true) {
                openSelection = {};
                break;
            } else {
                openSelection = nextOpenSelection;
            }
        }

        if (!currentAcceptedHydrations.length) {
            break;
        }

        acceptedHydrations.push(currentAcceptedHydrations);

        if (!Object.keys(openSelection).length) {
            break;
        }

        availableSelection = mergeSelections([
            availableSelection,
            ...currentAcceptedHydrations.map(acceptedHydration => acceptedHydration.getAcceptedSelection()),
        ]);
    }

    if (Object.keys(openSelection).length) {
        services.getTracing().hydrationHasOpenSelection(openSelection);
        return false;
    }

    return new DescribedEntityHydration(acceptedHydrations);
}
