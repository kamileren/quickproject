import { renderToString } from 'react-dom/server';
import App from './App';

export function render(view) {
  return renderToString(<App initialView={view} />);
}
