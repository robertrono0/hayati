import Anthropic from "@anthropic-ai/sdk";
import { ageFromDob, allQuestions, questionById, type Answers } from "./questionnaire";

export type Member = { id: string; answers: Answers };

const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

// ---------- Step 1: hard filters (one-directional: does B fit A's rules?) ----------
function fitsRules(a: Answers, b: Answers): string[] {
  const out: string[] = [];
  const dealbreakers = arr(a.dealbreakers);

  if (s(a.seeking) && s(b.gender)) {
    const want = s(a.seeking) === "Woman" ? "Woman" : "Man";
    if (s(b.gender) !== want) out.push("gender");
  }

  const ageB = ageFromDob(b.dob);
  if (ageB !== null) {
    if (a.age_min && ageB < num(a.age_min)) out.push("too young");
    if (a.age_max && ageB > num(a.age_max)) out.push("too old");
  }

  const sameFaith = s(a.religion) && s(a.religion) === s(b.religion);
  if ((s(a.partner_religion) === "Must share my faith" || dealbreakers.includes("Different religion")) && !sameFaith)
    out.push("different faith");

  if (s(a.wants_children) === "Yes" && s(b.wants_children) === "No") out.push("children plans");
  if (dealbreakers.includes("Doesn't want children") && s(b.wants_children) === "No") out.push("children plans");

  const bHasKids = s(b.has_children).startsWith("Yes");
  if (bHasKids && (s(a.partner_children_ok) === "No" || dealbreakers.includes("Has children"))) out.push("has children");

  if (dealbreakers.includes("Previously married") && s(b.marital_history) && s(b.marital_history) !== "Never married")
    out.push("previously married");

  const smoke = s(b.smoking);
  if (smoke && smoke !== "Never") {
    if (s(a.partner_smoking_ok) === "No" || dealbreakers.includes("Smokes")) out.push("smoking");
    else if (s(a.partner_smoking_ok) === "Hookah only" && smoke !== "Hookah socially") out.push("smoking");
  }

  if (dealbreakers.includes("Drinks") && s(b.drinking) && s(b.drinking) !== "Never") out.push("drinking");

  if (s(a.partner_background) === "Same background as me only" && s(a.background) !== s(b.background)) out.push("background");

  if (s(b.area) === "Outside San Diego County" && (s(a.relocate) === "No" || dealbreakers.includes("Lives far away")))
    out.push("distance");

  return out;
}

/** Returns the reasons two members can't match (empty array = compatible both ways). */
export function hardFilter(a: Answers, b: Answers): string[] {
  return [...new Set([...fitsRules(a, b), ...fitsRules(b, a)])];
}

// ---------- Step 2: quick rule-based score to shortlist ----------
export function quickScore(a: Answers, b: Answers): number {
  let score = 50;
  const scales = ["traditional", "family_involvement", "practice", "ambition", "social", "introvert", "planner", "fitness"];
  for (const k of scales) {
    const x = num(a[k]);
    const y = num(b[k]);
    if (!isNaN(x) && !isNaN(y)) score += 4 - Math.abs(x - y) * 2; // +4 if equal, -4 if far apart
  }
  if (s(a.timeline) && s(a.timeline) === s(b.timeline)) score += 6;
  if (s(a.religion) && s(a.religion) === s(b.religion)) score += 8;
  if (s(a.background) && s(a.background) === s(b.background)) score += 5;
  const shared = arr(a.interests).filter((i) => arr(b.interests).includes(i)).length;
  score += Math.min(shared * 2, 10);
  const langs = arr(a.languages).filter((l) => l !== "English" && arr(b.languages).includes(l)).length;
  if (langs) score += 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---------- Step 3: AI review ----------
/** Strips names, contact info and exact birthdate before anything goes to the AI. */
export function anonymize(answers: Answers) {
  const out: Record<string, unknown> = { age: ageFromDob(answers.dob) };
  for (const q of allQuestions) {
    if (q.privateField || q.id === "consent") continue;
    const v = answers[q.id];
    if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) continue;
    out[q.label] = q.type === "scale" ? `${v}/5 (1=${q.scale![0]}, 5=${q.scale![1]})` : v;
  }
  return out;
}

export type AiResult = { ref: string; score: number; summary: string; strengths: string; concerns: string };

export async function aiReview(member: Member, candidates: Member[]): Promise<Map<string, AiResult>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set. Add it in your hosting settings.");
  const client = new Anthropic({ apiKey: key });

  const refs = candidates.map((c, i) => ({ ref: `C${i + 1}`, c }));
  const prompt = `You are assisting a professional matchmaker for San Diego's Arab and Chaldean community. Families value faith, family closeness, shared culture and serious intentions toward marriage.

Evaluate how compatible the MEMBER is with each CANDIDATE for a long-term, marriage-minded relationship. They have already passed each other's hard dealbreakers. Weigh values, faith practice, family expectations, life plans and timeline most heavily, then lifestyle and personality. Be honest about real friction points. Do not invent facts that are not in the answers. Do not judge anyone on appearance.

MEMBER:
${JSON.stringify(anonymize(member.answers), null, 1)}

CANDIDATES:
${refs.map(({ ref, c }) => `${ref}:\n${JSON.stringify(anonymize(c.answers), null, 1)}`).join("\n\n")}

Reply with ONLY a JSON array, one object per candidate, no other text:
[{"ref":"C1","score":0-100,"summary":"one or two sentences on why they could work","strengths":"short list, comma separated","concerns":"short list, comma separated, or 'None notable'"}]`;

  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
  let parsed: AiResult[] = [];
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("The AI response could not be read. Please try again.");
  }

  const byRef = new Map(refs.map(({ ref, c }) => [ref, c.id]));
  const out = new Map<string, AiResult>();
  for (const r of parsed) {
    const id = byRef.get(r.ref);
    if (!id) continue;
    out.set(id, { ...r, score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))) });
  }
  return out;
}

export function displayAnswer(id: string, v: unknown): string {
  const q = questionById[id];
  if (v === undefined || v === null || v === "") return "";
  if (Array.isArray(v)) return v.join(", ");
  if (q?.type === "scale") return `${v} / 5  (${q.scale![0]} → ${q.scale![1]})`;
  return String(v);
}
