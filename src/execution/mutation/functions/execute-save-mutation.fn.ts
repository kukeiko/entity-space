import { EntityMutatorType } from "../entity-mutator";
import { MutationDispatch } from "../structures/mutation-dispatch";
import { dispatchUpsertMutation, MutationOutcomes } from "./dispatch-mutation.fn";

export function executeSaveMutation(dispatch: MutationDispatch): Promise<MutationOutcomes> {
    return dispatchUpsertMutation(dispatch, EntityMutatorType.Save);
}
