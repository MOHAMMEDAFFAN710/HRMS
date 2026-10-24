import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const AccountActions = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!user) return null;

    const signOut = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="care-account-actions">
            <span className="care-account-name">{user.first_name || user.username}</span>
            <button type="button" onClick={signOut} aria-label="Log out of your account">Log out</button>
        </div>
    );
};

export default AccountActions;