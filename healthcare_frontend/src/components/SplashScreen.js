import React, { useEffect, useState } from "react";
import "../styles/SplashScreen.css"; // Import the CSS for styling

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // Hide splash after delay
    }, 3000); // Adjust time (3000ms = 3s)

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      <h1>LOGO HERE</h1>
    </div>
  );
};

export default SplashScreen;
