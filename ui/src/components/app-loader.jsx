import { useClerk } from "@clerk/clerk-react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Loader } from "./loader";

const API = import.meta.env.VITE_API_URL;

export const AppLoader = ({ children }) => {
    const { loaded: clerkLoaded, isSignedIn, user } = useClerk();
    const [apiReady, setApiReady] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch(`${API}/ping`);
                setApiReady(res.ok);
                if (clerkLoaded) {
                    if (isSignedIn) {
                        const currentUserId = user.id;
                        sessionStorage.setItem("userId", currentUserId);
                    }
                }
            } catch {
                setApiReady(false);
            } finally {
                setChecked(true);
            }
        };

        init();

    }, [clerkLoaded, isSignedIn, user?.id]);

    const fullyReady = clerkLoaded && apiReady && checked;

    return fullyReady ? children : <Loader variant="screen" />;
};

AppLoader.propTypes = {
    children: PropTypes.node,
};
