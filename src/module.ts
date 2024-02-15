import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { PalindromePanel } from './components/PalindromePanel';
import { ReadOnlyInput } from 'components/ReadOnlyInput';

export const plugin = new PanelPlugin<SimpleOptions>(PalindromePanel).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'palindromeDs',
      path: 'palindromeDs',
      name: 'Palindrome Data Structure',
      description: 'Once rendered, your data structure will be displayed here',
      editor: ReadOnlyInput,
      settings: {
        placeholder: '',
      },
    })
    .addTextInput({
      path: 'palindromeConfig',
      name: 'Palindrome Configuration',
      description: 'Once rendered, your Palindrome.js configuration will be displayed here',
      settings: {
        useTextarea: true,
        rows: 10
      }
    })
    ;
});
