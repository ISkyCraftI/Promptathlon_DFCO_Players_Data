import { Pipe, PipeTransform } from "@angular/core";
import { fr } from "../utils/football";

/** `{{ 6.92 | fr: 2 }}` -> « 6,92 » (virgule décimale, « — » si absent). */
@Pipe({ name: "fr" })
export class FrPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 1): string {
    return fr(value, digits);
  }
}
