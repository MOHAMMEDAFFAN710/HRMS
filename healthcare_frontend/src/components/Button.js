import React from "react";
import "../styles/buttons.css"; // Link to styles

const Button = ({ label, onClick, className }) => {
    return (
        <button className={`custom-button ${className}`} onClick={onClick}>
            {label}
        </button>
    );
};

export default Button;
