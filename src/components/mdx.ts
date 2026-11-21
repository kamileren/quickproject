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
import CodeFile from './prose/CodeFile.astro';
import Pitfall from './prose/Pitfall.astro';
import NowYouCan from './prose/NowYouCan.astro';
import NextUp from './prose/NextUp.astro';
import Exercises from './practice/Exercises.astro';
import Exercise from './practice/Exercise.astro';
import Solution from './practice/Solution.astro';
import Hint from './practice/Hint.astro';
import Term from './popins/Term.astro';
import Symbol from './popins/Symbol.astro';
import Checkpoint from './popins/Checkpoint.astro';
import Derivation from './popins/Derivation.astro';
import Ref from './popins/Ref.astro';

export const mdxComponents = {
  Definition,
  Equation,
  Example,
  Figure,
  MarginNote,
  KeyTakeaways,
  GoingFurther,
  References,
  CodeFile,
  Pitfall,
  NowYouCan,
  NextUp,
  Exercises,
  Exercise,
  Solution,
  Hint,
  Term,
  Symbol,
  Checkpoint,
  Derivation,
  Ref,
};
