import React from 'react';

import { TextArea } from '@grafana/ui';
import { StandardEditorProps } from '@grafana/data';

interface Settings {
  placeholder: string;
}

interface Props extends StandardEditorProps<string, Settings> {}

export const ReadOnlyInput = ({ item, value, onChange }: Props) => {
  return (
    <TextArea
        id = 'readOnlyDs'
        rows={10}
        readOnly={true}
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={item.settings?.placeholder || ''}
    />
  );
};
