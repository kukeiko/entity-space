import { EntityQueryTracing } from "../../entity-query-tracing";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";
import { executeCreateMutation } from "./execute-create-mutation.fn";
import { executeDeleteMutation } from "./execute-delete-mutation.fn";
import { executeSaveMutation } from "./execute-save-mutation.fn";
import { executeUpdateMutation } from "./execute-update-mutation.fn";

export async function executeMutation(mutation: AcceptedEntityMutation, tracing: EntityQueryTracing): Promise<void> {
    if (mutation.isCreate()) {
        await executeCreateMutation(mutation, tracing);
    } else if (mutation.isUpdate()) {
        await executeUpdateMutation(mutation, tracing);
    } else if (mutation.isDelete()) {
        await executeDeleteMutation(mutation, tracing);
    } else if (mutation.isSave()) {
        await executeSaveMutation(mutation, tracing);
    }
}
