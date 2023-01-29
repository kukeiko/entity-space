import { Criterion } from "../../lib/criteria/criterion/criterion";
import { parseCriteria } from "../../lib/criteria/parser/parse-criteria.fn";
import { ICriterionShape } from "../../lib/criteria/templates/criterion-shape.interface";

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
        template: ICriterionShape,
        label?: string
    ): {
        shouldBe(remapped: (Criterion | string)[] | string | false, open?: (Criterion | string)[]): void;
    };
} {
    return {
        using(template: ICriterionShape, label?: string) {
            return {
                shouldBe(remapped: (Criterion | string)[] | string | false, open: (Criterion | string)[] = []) {
                    const templateName = label ?? (template as any).constructor.name;

                    if (remapped === false) {
                        specFn(`${criterion} should not remap using ${templateName}`, () => {
                            expect(template.reshape(parse(criterion))).toEqual(false);
                        });
                    } else {
                        const remappedString = typeof remapped === "string" ? remapped : `${remapped.join(", ")}`;

                        if (open.length === 0) {
                            specFn(`${criterion} should fully remap using ${templateName} to ${remappedString}`, () => {
                                const result = template.reshape(parse(criterion));
                                expect(result).not.toBe(false);

                                if (result !== false) {
                                    expect(result.getReshaped().join(", ")).toEqual(remappedString);
                                }
                            });
                        } else {
                            const openString = open.join(", ");

                            specFn(
                                `${criterion} should remap using ${templateName} to ${remappedString}, leaving ${openString}`,
                                () => {
                                    const result = template.reshape(parse(criterion));
                                    expect(result).not.toBe(false);

                                    if (result !== false) {
                                        expect(result.getReshaped().join(", ")).toEqual(remappedString);
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
