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
                fill={isFilled ? "#ffb400" : "none"}
                stroke="#ffb400"
                strokeWidth="2"
              >
                <use xlinkHref="#star" />
              </svg>
            </button>
          );
        })}
      </div>

      <p>Note actuelle : {currentRating}/{maxRating}</p>
    </div>
  );
};

export default StarRating;
