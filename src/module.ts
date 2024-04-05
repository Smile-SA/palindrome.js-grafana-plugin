import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { PalindromePanel } from './components/PalindromePanel';
import { ReadOnlyInput } from 'components/ReadOnlyInput';
import { Text } from 'components/Text';

export const plugin = new PanelPlugin<SimpleOptions>(PalindromePanel).setPanelOptions((builder) => {
  return builder
  .addCustomEditor({
    id: 'palindromeDescription',
    path: 'palindromeDescription',
    name: 'Description',
    editor: Text
  })
  .addCustomEditor({
      id: 'palindromeDs',
      path: 'palindromeDs',
      name: 'Palindrome Data Structure',
      description: 'Once rendered, your data structure will be displayed here. (Editable through query comments)',
      editor: ReadOnlyInput
  })
  .addTextInput({
    path: 'palindromeConfig',
    name: 'Palindrome Configuration',
    description: 'Once rendered, your Palindrome.js configuration will be displayed here. (Editable in the block below)',
    settings: {
      useTextarea: true,
      rows: 10
    }
  });
});
