import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, LogIn, LogOut, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, claimFirstAdmin, getAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Administration | Vetaal" },
      { name: "description", content: "A private screen for the person who looks after Vetaal's question library." },
      { property: "og:title", content: "Administration | Vetaal" },
      { property: "og:description", content: "Sign in to add questions to Vetaal from a checked CSV file." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHomePage,
});

type Stage = "checking" | "setup" | "signed-out" | "denied" | "allowed";

function AdminHomePage() {
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState("");

  async function refresh() {
    setStage("checking");
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session && !session.user.is_anonymous) {
      try {
        await getAdminAccess();
        setEmail(session.user.email ?? "");
        setStage("allowed");
        return;
      } catch {
        setStage("denied");
        return;
      }
    }

    try {
      const { exists } = await adminExists();
      setStage(exists ? "signed-out" : "setup");
    } catch {
      setStage("signed-out");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (stage === "checking") {
    return <Shell title="Checking access"><p className="mt-4 leading-7 text-muted-foreground">Your access is being confirmed.</p></Shell>;
  }

  if (stage === "setup") return <FirstAdminForm onCreated={refresh} />;
  if (stage === "signed-out") return <SignInForm onSignedIn={refresh} />;

  if (stage === "denied") {
    return (
      <Shell title="Administrator access required">
        <p className="mt-4 leading-7 text-muted-foreground">This account is not authorised to look after the question library.</p>
        <div className="mt-7">
          <Button variant="outline" onClick={() => { void signOutAndRefresh(refresh); }}>
            <LogOut /> Sign out
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Administration">
      <p className="mt-4 leading-7 text-muted-foreground">
        You are signed in as {email}. Questions can be added from a CSV file that follows the expected columns.
      </p>
      <div className="mt-8 rounded-md border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Import questions from a CSV file</h2>
        <p className="mt-2 leading-7 text-muted-foreground">
          Only new questions are added. Identifiers that already exist are reported and left untouched.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/admin/import"><Upload /> Open the import screen</Link>
        </Button>
      </div>
      <div className="mt-8">
        <Button variant="ghost" onClick={() => { void signOutAndRefresh(refresh); }}>
          <LogOut /> Sign out
        </Button>
      </div>
    </Shell>
  );
}

async function signOutAndRefresh(refresh: () => Promise<void>) {
  await supabase.auth.signOut();
  await refresh();
}

function SignInForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setMessage("The email address or password was not accepted.");
      setBusy(false);
      return;
    }
    await onSignedIn();
    setBusy(false);
  }

  return (
    <Shell title="Administrator sign-in">
      <p className="mt-4 leading-7 text-muted-foreground">Sign in with the account that looks after the question library.</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <Field id="sign-in-email" label="Email address" type="email" autoComplete="username" value={email} onChange={setEmail} />
        <Field id="sign-in-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          <LogIn /> {busy ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </Shell>
  );
}

function FirstAdminForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await claimFirstAdmin({ data: { email: email.trim(), password } });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage("The account was created. Sign in with it to continue.");
        setBusy(false);
        await onCreated();
        return;
      }
      await onCreated();
    } catch {
      setMessage("The account could not be created. Check the email address, choose a password of at least ten characters, and try again.");
    }
    setBusy(false);
  }

  return (
    <Shell title="Create the administrator account">
      <p className="mt-4 leading-7 text-muted-foreground">
        No administrator exists yet, so you may claim the role once. Choose an email address and a password of at least ten characters. This form disappears as soon as the account is made.
      </p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <Field id="setup-email" label="Email address" type="email" autoComplete="username" value={email} onChange={setEmail} />
        <Field id="setup-password" label="Password" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          <KeyRound /> {busy ? "Creating the account" : "Create the administrator account"}
        </Button>
      </form>
    </Shell>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium" htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="page-shell py-16 sm:py-24">
      <section className="mx-auto max-w-md">
        <p className="eyebrow">Vetaal administration</p>
        <h1 className="mt-3 font-display text-4xl">{title}</h1>
        {children}
      </section>
    </main>
  );
}
