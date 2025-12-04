import React, { useEffect, useState } from "react";
import "./SnowEffect.css";

const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const flakes = [];
    const count = 150; // Increased from 50 for thicker snow

    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100 + "%",
        animationDuration: Math.random() * 3 + 2 + "s", // 2-5s
        animationDelay: Math.random() * 5 + "s",
        size: Math.random() * 5 + 2 + "px", // 2-7px
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="snow-container">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default SnowEffect;
