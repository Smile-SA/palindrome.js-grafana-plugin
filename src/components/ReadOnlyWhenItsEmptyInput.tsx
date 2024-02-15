import React, { useState } from 'react';

import { TextArea } from '@grafana/ui';
import { StandardEditorProps } from '@grafana/data';

interface Settings {
  placeholder: string;
}

interface Props extends StandardEditorProps<string, Settings> {}

export const ReadOnlyWhenItsEmptyInput = ({ item, value, onChange }: Props) => {
  const [readOnly, setReadOnly] = useState(true);
  console.log(value)
  if (value?.length > 0) {
    setReadOnly(false);
  }
  return (
    <TextArea
        id = 'PalindromeConfig'
        rows={10}
        readOnly={readOnly}
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={item.settings?.placeholder || ''}
    />
  );
};
