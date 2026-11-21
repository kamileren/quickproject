import { blobs, rings, type Labelled } from './toy2d';

/**
 * Point sets for the support vector machine chapter.
 * - `apart`: two clusters with a clear gap, so many lines separate them.
 * - `few`: a smaller separable set, light enough to drag every point.
 * - `mixed`: two clusters that overlap, so no line separates them cleanly.
 * - `ringed`: one class inside the other, which no straight line can handle.
 */
export const apart: Labelled[] = blobs(24, 0.62, 4);
export const few: Labelled[] = blobs(14, 0.9, 9);
export const mixed: Labelled[] = blobs(44, 1.55, 21);
export const ringed: Labelled[] = rings(70, 0.42, 6);
