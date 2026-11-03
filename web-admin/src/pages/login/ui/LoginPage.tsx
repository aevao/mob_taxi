import { Navigate, useLocation, useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth";
import { useAuthToken } from "@/entities/session";

export function LoginPage() {
  const token = useAuthToken();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (token) return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div className="absolute -top-32 -left-32 size-[520px] rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-[420px] rounded-full bg-brand-700/40 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500 font-extrabold">
              W
            </span>
            <span className="text-lg font-bold">WHYP</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl leading-tight font-bold tracking-tight">
              Run Chicago's premium taxi fleet from one place.
            </h1>
            <p className="mt-4 text-[15px] text-zinc-400">
              Review driver applications, check documents and keep an eye on riders.
            </p>
          </div>
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} WHYP INC.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="size-5" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in to admin</h2>
          <p className="mt-1.5 mb-8 text-sm text-zinc-500">
            Staff access only. Use the credentials from the server's .env.
          </p>
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        </div>
      </div>
    </div>
  );
}
