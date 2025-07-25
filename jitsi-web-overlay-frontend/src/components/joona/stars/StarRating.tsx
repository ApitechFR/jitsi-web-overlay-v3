import React, { useState } from "react";
import SvgDefs from "../svgDef/SvgDefs";

import styles from './StarRating.module.css'

function StarRating () {
  const [currentRating, setCurrentRating] = useState(0);
  const maxRating = 5;

  return (
    <div className={styles.ratingContainer}>
        <SvgDefs />
      <div className={styles.starsGroup}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= currentRating;

          return (
            <button
              key={starNumber}
              type="button"
              onClick={() => setCurrentRating(starNumber)}
              className={styles.starStyle}
            >
              <svg
                width="48"
                height="48"
                fill={isFilled ? "#6f6f6fff" : "none"}
                stroke="#6f6f6fff"
                strokeWidth="1"
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
