import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { sessionApi } from "@/entities/session";
import { ApiError, tokenStorage } from "@/shared/api";
import { Button, Input } from "@/shared/ui";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => sessionApi.login(email.trim(), password),
    onSuccess: (session) => {
      tokenStorage.set(session.token);
      onSuccess();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    login.mutate();
  };

  const error =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? "Something went wrong. Try again."
        : undefined;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        placeholder="admin@whyp.com"
        icon={<Mail className="size-4" />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoFocus
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        icon={<Lock className="size-4" />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        loading={login.isPending}
        disabled={!email.trim() || !password}
        className="mt-2 w-full"
      >
        Sign in
      </Button>
    </form>
  );
}
