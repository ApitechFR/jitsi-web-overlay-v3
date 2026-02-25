import { Input } from '@ds';
import { FieldProps } from "./FieldComponent";

import styles from '../../pages/Feedback/FeedbackJoona.module.css';

export const InputField: React.FC<FieldProps> = ({ template, value, onChange }) => (
  <Input
    label={template.label}
    textArea
    className={styles.noResize}
    nativeTextAreaProps={{
      rows: 3,
      value: value || "",
      onChange: (e) => onChange(template.id, e.currentTarget.value),
    }}
  />
);