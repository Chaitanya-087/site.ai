import { UserResource } from "@clerk/types";

const getErrorMessageFromResponse = async (res: Response) => {
    try {
        const errData = await res.json();
        return errData.detail || errData.message || "An unknown error occurred";
    } catch {
        return "An unknown error occurred";
    }
};

export const formatUser = (user: UserResource) => ({
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.primaryEmailAddress?.emailAddress,
    avatar: user.imageUrl,
})

export const createMessage = (prompt: string, type: "ai" | "user") => ({
  id: Date.now().toString(),
  type: type,
  content: prompt,
});

export const setError = (set: any, err: any) => {
  const message = typeof err === "string" ? err : err.message;
  set({
    error: {
      message,
      timestamp: Date.now(),
    },
  });
};

export const handleRequest = async <T>(
  url: string,
  options: RequestInit = {},
  set: any
): Promise<T | null> => {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      setError(set, "Unauthorized: Invalid credentials");
      return null;
    }

    if (res.status === 403) {
      setError(
        set,
        "Forbidden: You do not have permission to perform this action."
      );
      return null;
    }

    if (!res.ok) {
      const errorMessage = await getErrorMessageFromResponse(res);
      setError(set, `Request failed: ${errorMessage}`);
      return null;
    }

    const data: T = await res.json();
    return data;
  } catch (err: any) {
    setError(set, `An unexpected error occurred: ${err.message || err}`);
    return null;
  }
};