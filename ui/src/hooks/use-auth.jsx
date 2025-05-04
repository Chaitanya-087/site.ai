import { createContext, useContext, useMemo, useState } from "react";
import avatarImgSrc from '@/assets/avatar.jpeg';


const defaultUser = {
    id: "",
    name: "shadcn",
    email: "m@example.com",
    avatar: avatarImgSrc
}

const AuthProviderContext = createContext({
    currentUser: defaultUser,
    setCurrentUser: () => null
});

import PropTypes from 'prop-types';

export function AuthProvider({ children, storageKey = "user" }) {
    const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(storageKey) || defaultUser)

    const value = useMemo(() => ({
        currentUser,
        setCurrentUser: (user) => {
            localStorage.setItem(storageKey, JSON.stringify(user));
            setCurrentUser(user);
        },
    }), [currentUser, storageKey]);

    return <AuthProviderContext.Provider value={value}>
        {children}
    </AuthProviderContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};


AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
    storageKey: PropTypes.string
};
