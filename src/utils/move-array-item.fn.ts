export function moveArrayItem(items: any[], from: number, to: number): void {
    [from, to] = [from, to].map(index => (index < 0 ? 0 : index > items.length - 1 ? items.length - 1 : index));

    if (from == to) {
        return;
    }

    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
}
