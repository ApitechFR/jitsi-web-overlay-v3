import { RadioField } from "./RadioField";
import { InputField } from "./InputField";
import { StarRatingField } from "./StarRatingField";
import type { FeedbackTemplate } from '@/api';

export interface FieldProps {
  template: FeedbackTemplate;
  value: string | number;
  onChange: (templateId: number, value: any) => void;
}

export const FieldComponent: Record<number, React.FC<FieldProps>> = {
  1: StarRatingField,
  2: InputField,
  3: RadioField,
};