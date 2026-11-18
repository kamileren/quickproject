/**
 * Components every chapter can use without importing them.
 * Chapter-specific figures are imported inside the chapter's MDX file.
 */
import Definition from './prose/Definition.astro';
import Equation from './prose/Equation.astro';
import Example from './prose/Example.astro';
import Figure from './prose/Figure.astro';
import MarginNote from './prose/MarginNote.astro';
import KeyTakeaways from './prose/KeyTakeaways.astro';
import GoingFurther from './prose/GoingFurther.astro';
import References from './prose/References.astro';
import Term from './popins/Term.astro';
import Symbol from './popins/Symbol.astro';
import Checkpoint from './popins/Checkpoint.astro';
import Derivation from './popins/Derivation.astro';

export const mdxComponents = {
  Definition,
  Equation,
  Example,
  Figure,
  MarginNote,
  KeyTakeaways,
  GoingFurther,
  References,
  Term,
  Symbol,
  Checkpoint,
  Derivation,
};
