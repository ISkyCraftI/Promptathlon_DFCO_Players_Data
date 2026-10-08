import { Pipe, PipeTransform } from "@angular/core";
import { euros } from "../utils/football";

/** `{{ 1250000 | eur }}` -> « 1,25 M€ » ; `{{ 1250000 | eur: false }}` -> « 1 250 000 € ». */
@Pipe({ name: "eur" })
export class EurPipe implements PipeTransform {
  transform(value: number | null | undefined, compact = true): string {
    return euros(value, compact);
  }
}
