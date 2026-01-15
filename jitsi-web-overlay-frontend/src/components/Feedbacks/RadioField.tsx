import { RadioButtons } from '@ds';
import { FieldProps } from "./FieldComponent";

export const RadioField: React.FC<FieldProps> = ({ template, value, onChange }) => (
  <RadioButtons
    legend={template.label}
    options={template.choices?.map((choice: string) => ({
      label: choice,
      nativeInputProps: {
        value: choice,
        checked: value === choice,
        onChange: () => onChange(template.id, choice),
      },
    })) || []}
  />
);