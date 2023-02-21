export function assertValidPaths(paths: string[]): void {
    if (!paths.length) {
        throw new Error("paths can not be empty");
    } else if (paths.some(path => !path.length)) {
        throw new Error("paths can not contain an empty path");
    } else if (
        paths.some((path, index) =>
            paths.some(
                (otherPath, otherIndex) =>
                    otherIndex !== index &&
                    (path.includes(".") || otherPath.includes(".")) &&
                    (path.includes(otherPath) || otherPath.includes(path))
            )
        )
    ) {
        throw new Error("one path can not be contained in another path");
    }
}
