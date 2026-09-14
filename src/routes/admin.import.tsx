import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, LogIn, LogOut, Upload } from "lucide-react";
import Papa from "papaparse";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminAccess,
  importQuestions,
  type ImportResult,
  type QuestionImportRow,
} from "@/lib/admin.functions";

const EXPECTED_HEADER = [
  "question_id",
  "category",
  "subcategory",
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "difficulty",
  "detail",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

export const Route = createFileRoute("/admin/import")({
  head: () => ({
    meta: [
      { title: "Question Import | Vetaal Administration" },
      { name: "description", content: "A private screen for adding questions to Vetaal from a checked CSV file." },
      { property: "og:title", content: "Question Import | Vetaal Administration" },
      { property: "og:description", content: "A private screen for adding checked questions to Vetaal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminImportPage,
});

type AccessState = "checking" | "signed-out" | "denied" | "allowed";

function AdminImportPage() {
  const [access, setAccess] = useState<AccessState>("checking");

  async function checkAccess() {
    const { data } = await supabase.auth.getSession();
    if (!data.session || data.session.user.is_anonymous) {
      setAccess("signed-out");
      return;
    }
    try {
      await getAdminAccess();
      setAccess("allowed");
    } catch {
      setAccess("denied");
    }
  }

  useEffect(() => {
    void checkAccess();
  }, []);

  if (access === "checking") return <AdminState title="Checking access" text="Your administrator access is being confirmed." />;
  if (access === "signed-out") return <AdminSignIn onSignedIn={checkAccess} />;
  if (access === "denied") return <AdminDenied />;
  return <ImportWorkspace onSignedOut={() => setAccess("signed-out")} />;
}

function AdminSignIn({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
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
    <main className="page-shell py-16 sm:py-24">
      <section className="mx-auto max-w-md" aria-labelledby="admin-sign-in-title">
        <p className="eyebrow">Vetaal administration</p>
        <h1 id="admin-sign-in-title" className="mt-3 font-display text-4xl">Administrator sign-in</h1>
        <p className="mt-4 leading-7 text-muted-foreground">Sign in with the account assigned to question administration.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium" htmlFor="admin-email">
            Email address
            <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium" htmlFor="admin-password">
            Password
            <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </label>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            <LogIn /> {busy ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}

function AdminDenied() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <AdminState title="Administrator access required" text="This account is not authorised to import questions.">
      <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
    </AdminState>
  );
}

function ImportWorkspace({ onSignedOut }: { onSignedOut: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ImportMode>("add");
  const [result, setResult] = useState<ImportResult>();

  function clearSelection(clearResult = true) {
    setRows([]);
    if (clearResult) setResult(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  function readFile(file: File | undefined) {
    clearSelection();
    setFileError("");
    setFileName(file?.name ?? "");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || (file.type && !["text/csv", "application/vnd.ms-excel"].includes(file.type))) {
      setFileError("Choose a CSV file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("The file is larger than 5 MB.");
      return;
    }

    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: ({ data, errors }) => {
        if (errors.length > 0) {
          setFileError(`The CSV could not be read. ${errors[0]?.message ?? "Check its formatting."}`);
          return;
        }
        const [header = [], ...body] = data;
        const differences = EXPECTED_HEADER.flatMap((name, index) => header[index] === name ? [] : [`column ${index + 1} must be ${name}`]);
        if (header.length !== EXPECTED_HEADER.length) differences.push(`the file has ${header.length} columns instead of ${EXPECTED_HEADER.length}`);
        if (differences.length > 0) {
          setFileError(`The header is not correct: ${differences.join("; ")}.`);
          return;
        }
        if (body.length > MAX_ROWS) {
          setFileError("The file contains more than 5,000 rows.");
          return;
        }
        setRows(body.map((cells, index) => ({
          rowNumber: index + 2,
          question_id: cells[0] ?? "",
          category: cells[1] ?? "",
          subcategory: cells[2] ?? "",
          question: cells[3] ?? "",
          option_a: cells[4] ?? "",
          option_b: cells[5] ?? "",
          option_c: cells[6] ?? "",
          option_d: cells[7] ?? "",
          correct_answer: (cells[8] ?? "") as QuestionImportRow["correct_answer"],
          difficulty: cells[9] ?? "",
          detail: cells[10] ?? "",
        })));
      },
      error: () => setFileError("The CSV file could not be read."),
    });
  }

  async function upload() {
    setBusy(true);
    setFileError("");
    try {
      setResult(await importQuestions({ data: { rows } }));
      clearSelection(false);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The questions could not be imported.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    onSignedOut();
  }

  return (
    <main className="page-shell py-12 sm:py-18">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">Vetaal administration</p><h1 className="mt-3 font-display text-4xl">Import questions</h1></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link to="/admin">Administration</Link></Button>
            <Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button>
          </div>
        </div>

        <section className="py-8" aria-labelledby="choose-file-title">
          <h2 id="choose-file-title" className="font-display text-2xl">Choose a CSV file</h2>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">The file may contain up to 5,000 rows and must be no larger than 5 MB. Existing question identifiers will be left unchanged.</p>
          <label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-card px-6 text-center transition-colors hover:border-primary" htmlFor="question-csv">
            <FileText className="mb-3 size-7 text-primary" aria-hidden="true" />
            <span className="font-medium">{fileName || "Select a CSV file"}</span>
            <span className="mt-1 text-sm text-muted-foreground">CSV only</span>
          </label>
          <input ref={inputRef} id="question-csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} />
          {fileError ? <p role="alert" className="mt-4 text-sm text-destructive">{fileError}</p> : null}
          {rows.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p><strong>{rows.length.toLocaleString()}</strong> rows are ready for validation.</p>
              <Button size="lg" onClick={upload} disabled={busy}><Upload /> {busy ? "Importing" : "Import questions"}</Button>
            </div>
          ) : null}
        </section>

        {result ? <ImportSummary result={result} /> : null}
      </div>
    </main>
  );
}

function ImportSummary({ result }: { result: ImportResult }) {
  return (
    <section className="border-t border-border py-8" aria-labelledby="import-summary-title" aria-live="polite">
      <p className="eyebrow">Upload complete</p>
      <h2 id="import-summary-title" className="mt-3 font-display text-3xl">Import summary</h2>
      <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        {[["Added", result.added], ["Skipped as duplicates", result.skipped], ["Rejected as invalid", result.rejected.length]].map(([label, value]) => (
          <div key={label} className="bg-card p-5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-display text-3xl">{value}</dd></div>
        ))}
      </dl>
      {result.duplicateIds.length > 0 ? <div className="mt-8"><h3 className="font-display text-xl">Skipped identifiers</h3><ul className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2">{result.duplicateIds.map((id) => <li key={id} className="rounded-md border border-border bg-card px-3 py-2">{id}</li>)}</ul></div> : null}
      {result.rejected.length > 0 ? <div className="mt-8"><h3 className="font-display text-xl">Rejected rows</h3><ol className="mt-3 space-y-2">{result.rejected.map((item, index) => <li key={`${item.rowNumber}-${index}`} className="rounded-md border border-border bg-card px-4 py-3"><strong>Row {item.rowNumber || "unknown"}</strong><p className="mt-1 text-sm text-muted-foreground">{item.reasons.join("; ")}</p></li>)}</ol></div> : null}
    </section>
  );
}

function AdminState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return <main className="page-shell flex min-h-[65vh] items-center"><div className="mx-auto max-w-xl text-center"><p className="eyebrow">Vetaal administration</p><h1 className="mt-3 font-display text-4xl">{title}</h1><p className="mt-4 text-muted-foreground">{text}</p>{children ? <div className="mt-7">{children}</div> : null}</div></main>;
}