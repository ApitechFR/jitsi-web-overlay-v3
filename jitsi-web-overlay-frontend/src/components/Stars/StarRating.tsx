import React from "react";
import SvgDefs from "../SvgDef/SvgDefs";

import styles from './StarRating.module.css'

interface StarRatingProps {
  rating: number;
  changeRating: (value: number) => void;
}

function StarRating({ rating, changeRating }: StarRatingProps) {
  const maxRating = 5;

  return (
    <div className={styles.ratingContainer}>
      <SvgDefs />
      <div className={styles.starsGroup}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= rating;

          return (
            <button
              key={starNumber}
              type="button"
              onClick={() => changeRating(starNumber)}
              className={styles.starStyle}
            >
              <svg
                width="48"
                height="48"
                fill={isFilled ? "#285fd5" : "none"}
                stroke="#285fd5"
                strokeWidth={isFilled ? 2 : 1}
              >
                <use xlinkHref="#star" />
              </svg>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default StarRating;
