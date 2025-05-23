import { useTheme } from "@/hooks/use-theme";
import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

function Login() {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignIn appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
        }} />
      </div>
    </div>
  );
}

export default Login;
