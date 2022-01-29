import { Criterion } from "../lib/criterion/criterion";
import { parseCriteria } from "../lib/parser/parse-criteria.fn";
import { ICriterionTemplate } from "../lib/templates/criterion-template.interface";

function parse<T extends Criterion | string>(item: T): Criterion {
    if (typeof item === "string") {
        return parseCriteria(item);
    }

    return item;
}

export function fremapping(criterion: Criterion | string) {
    return remapping(criterion, fit);
}

export function xremapping(criterion: Criterion | string) {
    return remapping(criterion, xit);
}

export function remapping(
    criterion: Criterion | string,
    specFn = it
): {
    using(
        template: ICriterionTemplate,
        label?: string
    ): {
        shouldBe(remapped: (Criterion | string)[] | string | false, open?: (Criterion | string)[]): void;
    };
} {
    return {
        using(template: ICriterionTemplate, label?: string) {
            return {
                shouldBe(remapped: (Criterion | string)[] | string | false, open: (Criterion | string)[] = []) {
                    const templateName = label ?? (template as any).constructor.name;

                    if (remapped === false) {
                        specFn(`${criterion} should not remap using ${templateName}`, () => {
                            expect(template.remap(parse(criterion))).toEqual(false);
                        });
                    } else {
                        const remappedString = typeof remapped === "string" ? remapped : `${remapped.join(", ")}`;

                        if (open.length === 0) {
                            specFn(`${criterion} should fully remap using ${templateName} to ${remappedString}`, () => {
                                const result = template.remap(parse(criterion));
                                expect(result).not.toBe(false);

                                if (result !== false) {
                                    expect(result.getCriteria().join(", ")).toEqual(remappedString);
                                }
                            });
                        } else {
                            const openString = open.join(", ");

                            specFn(
                                `${criterion} should remap using ${templateName} to ${remappedString}, leaving ${openString}`,
                                () => {
                                    const result = template.remap(parse(criterion));
                                    expect(result).not.toBe(false);

                                    if (result !== false) {
                                        expect(result.getCriteria().join(", ")).toEqual(remappedString);
                                        expect(result.getOpen().join(", ")).toEqual(open.join(", "));
                                    }
                                }
                            );
                        }
                    }
                },
            };
        },
    };
}
