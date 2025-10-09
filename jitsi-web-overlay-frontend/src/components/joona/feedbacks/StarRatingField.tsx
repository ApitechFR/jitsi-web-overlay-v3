import StarRating from "../stars/StarRating";
import { FieldProps } from "./FieldComponent";

export const StarRatingField: React.FC<FieldProps> = ({ template, value, onChange }) => (
  <StarRating
    rating={Number(value) || 0}
    changeRating={(val) => onChange(template.id, String(val))}
  />
);