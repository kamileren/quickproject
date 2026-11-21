import { describe, expect, it } from 'vitest';
import { block, linkTerms } from './recap';

const terms = [
  { id: 'mse', term: 'Mean squared error', definition: 'The average of the squared misses.' },
  { id: 'residual', term: 'Residual', definition: 'One miss: the true value minus the "predicted" one.' },
];

describe('recap helpers', () => {
  it('pulls a block out of a chapter', () => {
    expect(block('before <KeyTakeaways>\n- one\n</KeyTakeaways> after', 'KeyTakeaways')).toBe('- one');
    expect(block('nothing here', 'KeyTakeaways')).toBeUndefined();
  });

  it('links bold glossary terms, including plurals, and leaves other bold text alone', () => {
    const html = '<li>A <strong>residual</strong> is one miss. <strong>Residuals</strong> add up. The <strong>mean squared error</strong> and <strong>RMSE</strong>.</li>';
    const linked = linkTerms(html, terms);
    expect(linked.match(/class="recap-term"/g)).toHaveLength(3);
    expect(linked).toContain('<a class="recap-term" href="/glossary/#mse" title="The average of the squared misses."><strong>mean squared error</strong></a>');
    expect(linked).toContain('<strong>RMSE</strong>.');
    expect(linked).not.toContain('#rmse');
  });

  it('keeps quotes in a definition from breaking the page', () => {
    expect(linkTerms('<strong>residual</strong>', terms)).toContain('&quot;predicted&quot;');
  });
});
