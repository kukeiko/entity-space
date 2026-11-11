import { MutationDispatch } from "../structures/mutation-dispatch";
import { dispatchDeleteMutation, MutationOutcomes } from "./dispatch-mutation.fn";

export function executeDeleteMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    return dispatchDeleteMutation(dispatch);
}
