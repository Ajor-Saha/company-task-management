"use client";
import { CheckCircle2, EyeOff, ServerCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/schemas/auth-schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "waking" | "ready">(
    "checking"
  );
  const [showStatusPopup, setShowStatusPopup] = useState(true);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let wakeTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (isMounted) {
        setServerStatus("waking");
      }
    }, 2200);
    let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

    const checkServer = async () => {
      try {
        await Axios.get("/api/auth/server-status", { timeout: 12000 });
        if (!isMounted) {
          return;
        }

        setServerStatus("ready");
        autoHideTimer = setTimeout(() => {
          if (isMounted) {
            setShowStatusPopup(false);
          }
        }, 1800);
      } catch (error) {
        // Retry once to tolerate temporary cold starts or TLS handshake hiccups.
        try {
          await sleep(1200);
          await Axios.get("/api/auth/server-status", { timeout: 12000 });
          if (!isMounted) {
            return;
          }

          setServerStatus("ready");
          autoHideTimer = setTimeout(() => {
            if (isMounted) {
              setShowStatusPopup(false);
            }
          }, 1800);
        } catch {
          if (!isMounted) {
            return;
          }

          // Fail silently and allow normal sign-in flow without showing warning errors.
          setServerStatus("ready");
          setShowStatusPopup(false);
        }
      } finally {
        if (wakeTimer) {
          clearTimeout(wakeTimer);
          wakeTimer = null;
        }
      }
    };

    checkServer();

    return () => {
      isMounted = false;
      if (wakeTimer) {
        clearTimeout(wakeTimer);
      }
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (serverStatus === "checking" || serverStatus === "waking") {
      setShowStatusPopup(true);
      toast.info("Server is starting. Please wait a moment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await Axios.post("/api/auth/signin", data);
      toast.success(response.data.message || "Login Successful");
      // console.log("Login Successful:", response.data);
      login(response.data.data, response.data.accessToken);

      router.push("/dashboard"); // Redirect to the dashboard after login
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Login Error:", error);
      }
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data.message ?? "Invalid credentials. Try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isServerBusy = serverStatus === "checking" || serverStatus === "waking";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
      {showStatusPopup && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div
            style={{ animation: "statusPopIn 300ms ease-out" }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-100 bg-white/95 shadow-2xl backdrop-blur"
          >
            <div className="relative bg-gradient-to-r from-sky-50 via-white to-blue-50 px-4 py-4">
              <button
                type="button"
                onClick={() => setShowStatusPopup(false)}
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                aria-label="Close status popup"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-2 ${
                    serverStatus === "ready"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {serverStatus === "ready" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ServerCog className="h-4 w-4 animate-spin" />
                  )}
                </div>

                <div className="space-y-1 pr-6">
                  <p className="text-sm font-semibold text-slate-900">
                    {serverStatus === "checking" && "Checking Server Status"}
                    {serverStatus === "waking" && "Server Is Waking Up"}
                    {serverStatus === "ready" && "Server Is Ready"}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {serverStatus === "checking" &&
                      "Connecting to the backend now. This helps avoid a slow first login."}
                    {serverStatus === "waking" &&
                      "Your Render free instance is starting. It can take up to a couple of minutes."}
                    {serverStatus === "ready" &&
                      "Great news. The backend responded and you can sign in now."}
                  </p>

                  {(serverStatus === "checking" || serverStatus === "waking") && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-balance text-muted-foreground">
                    Login to your Acme Inc account
                  </p>
                </div>
                <div className="px-5 py-2">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        name="email"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <Input
                              {...field}
                              placeholder="Enter your email"
                              type="email"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="password"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isSubmitting || isServerBusy}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Please wait
                          </>
                        ) : isServerBusy ? (
                          "Starting server..."
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
                {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <div className="w-full px-2">
                  <Button variant="outline" className="w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="sr-only">Login with Google</span>
                  </Button>
                </div> */}
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/create-new-company"
                    className="underline underline-offset-4"
                  >
                    Register
                  </Link>
                </div>
              </div>

              <div className="relative hidden  md:block">
                <Image
                  src="/asset/SignIn.jpg"
                  alt="Image"
                  width={1000}
                  height={800}
                  priority
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] "
                />
              </div>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes statusPopIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
