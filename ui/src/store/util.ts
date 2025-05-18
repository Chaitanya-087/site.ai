export const getErrorMessageFromResponse = async (res: Response) => {
    try {
        const errData = await res.json();
        return errData.detail || errData.message || "An unknown error occurred";
    } catch {
        return "An unknown error occurred";
    }
};
