export function hasInterfaceMarker(marker: symbol, value: unknown): boolean {
    if (value == null) {
        return false;
    }

    return (value as any)[marker] === true;
}
