export function isNotNullsyEntryValue<T>(keyValue: readonly [key: string, value: T]): keyValue is [string, Exclude<T, null | undefined>] {
    return keyValue[1] != null;
}
