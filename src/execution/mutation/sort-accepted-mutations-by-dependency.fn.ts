import { AcceptedEntityMutation } from "./accepted-entity-mutation";

export function sortAcceptedMutationsByDependency(
    acceptedMutations: readonly AcceptedEntityMutation[],
): AcceptedEntityMutation[] {
    const graph = new Map<AcceptedEntityMutation, AcceptedEntityMutation[]>();
    const inDegree = new Map<AcceptedEntityMutation, number>();

    for (const acceptedMutation of acceptedMutations) {
        graph.set(acceptedMutation, []);
        inDegree.set(acceptedMutation, 0);
    }

    for (const acceptedMutation of acceptedMutations) {
        for (const dependency of acceptedMutations.filter(mutation => mutation.isDependencyOf(acceptedMutation))) {
            graph.get(dependency)!.push(acceptedMutation);
            inDegree.set(acceptedMutation, inDegree.get(acceptedMutation)! + 1);
        }
    }

    const queue = [...inDegree.entries()].filter(([, degree]) => degree === 0).map(([mutation]) => mutation);
    const sorted: AcceptedEntityMutation[] = [];

    while (queue.length) {
        const current = queue.shift()!;
        sorted.push(current);

        for (const neighbor of graph.get(current)!) {
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);

            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length !== acceptedMutations.length) {
        throw new Error("cyclic mutation dependency");
    }

    return sorted;
}
