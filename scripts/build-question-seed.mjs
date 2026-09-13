import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const source = readFileSync("supabase/seed/questions.csv", "utf8");
const rows = parse(source, { columns: true, skip_empty_lines: true });
const required = ["question_id", "category", "subcategory", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "difficulty", "detail"];
if (rows.length === 0 || rows.some((row) => required.some((key) => !(key in row)))) throw new Error("Question seed shape is invalid");
const quote = (value) => value === "" ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const values = rows.map((row) => `(${required.map((key) => quote(row[key])).join(", ")})`).join(",\n");
writeFileSync("/tmp/vetaal-seed.sql", `INSERT INTO public.questions (${required.join(", ")}) VALUES\n${values};\n`);
console.log(`Parsed ${rows.length} quoted CSV rows across ${new Set(rows.map((row) => row.category)).size} categories.`);
