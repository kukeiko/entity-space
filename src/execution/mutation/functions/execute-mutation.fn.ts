import { MutationDispatch } from "../structures/mutation-dispatch";
import { MutationOutcomes } from "./dispatch-mutation.fn";
import { executeCreateMutation } from "./execute-create-mutation.fn";
import { executeDeleteMutation } from "./execute-delete-mutation.fn";
import { executeSaveMutation } from "./execute-save-mutation.fn";
import { executeUpdateMutation } from "./execute-update-mutation.fn";

export function executeMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    const { mutation } = dispatch;

    if (mutation.isCreate()) {
        return executeCreateMutation(dispatch);
    } else if (mutation.isUpdate()) {
        return executeUpdateMutation(dispatch);
    } else if (mutation.isDelete()) {
        return executeDeleteMutation(dispatch);
    } else {
        return executeSaveMutation(dispatch);
    }
}
