import Input from '@apitechfr/react-dsapitech/Input';
import { FieldProps } from "./FieldComponent";

export const InputField: React.FC<FieldProps> = ({ template, value, onChange }) => (
  <Input
    label={template.label}
    nativeInputProps={{
        value: value || "",
        onChange: (e) => onChange(template.id, e.currentTarget.value),
    }}
  />
);