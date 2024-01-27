export function toDestructurableInstance<T>(instance: T): T {
    const destructured: Record<string, Function> = {};
    const prototype = Object.getPrototypeOf(instance);

    for (const name of Object.getOwnPropertyNames(prototype)) {
        if (name === "constructor") {
            continue;
        }

        const member = prototype[name];

        if (member instanceof Function) {
            destructured[name] = member.bind(instance);
        }
    }

    return destructured as any as T;
}
