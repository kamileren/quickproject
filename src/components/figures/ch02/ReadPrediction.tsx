import { useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { predict, type Line } from '@/lib/linear';
import { ControlBar, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot, PlotLabel, Segments } from '../core/Plot';

/** The example line used in the text before the reader knows how to find the best one. */
const LINE: Line = { w: 5, b: 45 };

/** Pick a number of hours and read the prediction off the line, with the arithmetic shown. */
export default function ReadPrediction() {
  const [hours, setHours] = useState(4);
  const yHat = predict(LINE, hours);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        label={`The line score = 5 times hours plus 45. At ${hours} hours it predicts ${yHat.toFixed(1)}.`}
      >
        <Dots points={examPoints} fill={COLORS.faint} r={3.5} />
        <FnLine f={(x) => predict(LINE, x)} />
        <Segments
          stroke={COLORS.ink}
          segments={[
            { from: { x: hours, y: EXAM_Y[0] }, to: { x: hours, y: yHat } },
            { from: { x: hours, y: yHat }, to: { x: EXAM_X[0], y: yHat } },
          ]}
        />
        <Dots points={[{ x: hours, y: yHat }]} fill={COLORS.accent} r={6} />
        <PlotLabel x={hours} y={yHat} dx={10} dy={16}>{`ŷ = ${yHat.toFixed(1)}`}</PlotLabel>
      </Plot>

      <Readout
        items={[
          { label: 'Hours x', value: hours.toFixed(1) },
          { label: 'w · x + b', value: `${LINE.w} × ${hours.toFixed(1)} + ${LINE.b}` },
          { label: 'Predicted score ŷ', value: yHat.toFixed(1), key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Hours studied" value={hours} min={0} max={10} step={0.5} onChange={setHours} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
