import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseIntsPipe implements PipeTransform<string | undefined, number[]> {
    transform(value: string | undefined, _: ArgumentMetadata): number[] {
        return (value ?? "")
            .split(",")
            .map(value => parseInt(value, 10))
            .filter(value => !isNaN(value));
    }
}
