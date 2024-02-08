import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { PalindromePanel } from './components/PalindromePanel';

export const plugin = new PanelPlugin<SimpleOptions>(PalindromePanel).setPanelOptions((builder) => {
  return builder;
});
