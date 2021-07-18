export function scanSymbol(char: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let buffer = char;
    let next = iterator.next();

    return [buffer, next];
}
