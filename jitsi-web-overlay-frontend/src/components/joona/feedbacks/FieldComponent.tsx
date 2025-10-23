import { RadioField } from "./RadioField";
import { InputField } from "./InputField";
import { StarRatingField } from "./StarRatingField";
import { FeedbackTemplate } from "../../../pages/joona/Feedback/FeedbackJoona";

export interface FieldProps {
  template: FeedbackTemplate;
  value: string | number;
  onChange: (templateId: number, value: any) => void;
}

export const FieldComponent: Record<string, React.FC<FieldProps>> = {
  "rating": StarRatingField,
  "text": InputField,
  "radio": RadioField,
};