export function hasProperty<T extends string>(value: unknown, key: T): value is typeof value & Record<T, unknown> {
    return (value ?? ({} as any))[key] !== void 0;
}
