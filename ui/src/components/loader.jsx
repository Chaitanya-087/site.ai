import clsx from "clsx"
import PropTypes from "prop-types";
import { useTheme } from "../hooks/use-theme.jsx";
import { SpinnerCircularFixed } from "spinners-react";

export const Loader = ({ className, variant = "default", ...props }) => {
    const { theme } = useTheme();
    const style = {
        "screen": "w-screen h-screen",
        "component": "w-full h-full",
        "inline": "w-auto h-auto",
        "default": "w-full h-full"
    }
    return (
        <div className={clsx("text-center flex flex-col items-center justify-center", className, style[variant])} {...props}>
            <div className="flex items-center justify-center gap-1">
                <SpinnerCircularFixed size={25} thickness={125} speed={100} color={theme == 'dark' ? "#ffffff" : '#000000'} secondaryColor={theme == 'dark' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
                {
                    variant === "screen" &&
                    <span className="text-md font-bold">
                        Loading...
                    </span>
                }
            </div>
        </div >
    )
}

Loader.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(["screen", "component", "inline", "default"]),
};
