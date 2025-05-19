import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export function LoginForm({ className, ...props }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Site.ai</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Site.ai.</h1>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 2.247c-5.386 0-9.753 4.367-9.753 9.753 0 4.322 2.795 8.004 6.66 9.311.486.09.665-.21.665-.476 0-.23-.009-.839-.016-1.642-2.717.591-3.312-1.332-3.312-1.332-.444-1.132-1.08-1.433-1.08-1.433-.883-.606.066-.593.066-.593.975.068 1.49.999 1.49.999.869 1.485 2.287 1.057 2.857.809.09-.629.341-1.056.621-1.298-2.175-.245-4.462-1.087-4.462-4.835 0-1.067.381-1.938 1.005-2.611-.101-.252-.435-1.236.096-2.572 0 0 .821-.262 2.686.997.781-.218 1.614-.326 2.444-.331.829.005 1.662.113 2.444.331 1.864-1.26 2.683-.997 2.683-.997.532 1.336.198 2.32.097 2.572.624.673 1.002 1.544 1.002 2.61 0 3.757-2.292 4.587-4.471 4.827.352.302.665.905.665 1.815 0 1.315-.012 2.372-.012 2.696 0 .265.178.577.67.475 3.859-1.306 6.654-4.986 6.654-9.308 0-5.386-4.367-9.753-9.753-9.753z"
                  fill="currentColor"
                />
              </svg>
              Continue with Github
            </Button>
            <Button variant="outline" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
