import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isSignedIn) {
            navigate("/login", { replace: true });
        }
    }, [isSignedIn, navigate]);

    return <React.Fragment>{children}</React.Fragment>;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node,
};

export default ProtectedRoute;
