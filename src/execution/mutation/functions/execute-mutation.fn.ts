import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { executeCreateMutation } from "./execute-create-mutation.fn";
import { executeDeleteMutation } from "./execute-delete-mutation.fn";
import { executeSaveMutation } from "./execute-save-mutation.fn";
import { executeUpdateMutation } from "./execute-update-mutation.fn";

export async function executeMutation(
    mutation: AcceptedEntityMutation,
    context: EntityMutationContext,
    services: EntityServiceContainer,
): Promise<void> {
    if (mutation.isCreate()) {
        await executeCreateMutation(mutation, context, services);
    } else if (mutation.isUpdate()) {
        await executeUpdateMutation(mutation, context, services);
    } else if (mutation.isDelete()) {
        await executeDeleteMutation(mutation, context, services);
    } else if (mutation.isSave()) {
        await executeSaveMutation(mutation, context, services);
    }
}
