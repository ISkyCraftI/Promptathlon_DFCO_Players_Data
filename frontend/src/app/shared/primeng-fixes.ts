import { AutoFocus } from "primeng/autofocus";

/**
 * Contournement PrimeNG 21.1 : la directive AutoFocus pose l'attribut HTML `autofocus`
 * dès que l'input vaut `undefined` (test strict `=== false`). Résultat : le navigateur
 * donne le focus au premier bouton rendu. On ramène `undefined` à `false`.
 * À retirer quand PrimeNG corrige le test.
 */
const original = AutoFocus.prototype.onAfterContentChecked;
AutoFocus.prototype.onAfterContentChecked = function (this: AutoFocus) {
  if (this.autofocus == null) this.autofocus = false;
  original.call(this);
};
