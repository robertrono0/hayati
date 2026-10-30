// =============================================================
// The member questionnaire. Edit questions here; the form, the
// admin view and the AI matcher all read from this one file.
// Question ids must stay unique. Do not rename an id after launch
// (old answers are stored under it); change the label instead.
// =============================================================

export type QuestionType = "single" | "multi" | "scale" | "text" | "longtext" | "number" | "date" | "photo";

export type Question = {
  id: string;
  label: string;
  help?: string;
  type: QuestionType;
  options?: string[];
  scale?: [string, string]; // labels for 1 and 5
  required?: boolean;
  min?: number;
  max?: number;
  /** hidden from the AI (contact or identifying info) */
  privateField?: boolean;
};

export type Section = {
  id: string;
  title: string;
  intro?: string;
  questions: Question[];
};

const yesNoOpen = ["Yes", "No", "Open to it"];

export const sections: Section[] = [
  {
    id: "basics",
    title: "The basics",
    intro: "Only our matchmaking team sees your answers. Nobody else on the site can ever see your profile.",
    questions: [
      { id: "phone", label: "Phone number", type: "text", required: true, privateField: true, help: "So we can call you when we have an introduction." },
      { id: "dob", label: "Date of birth", type: "date", required: true, privateField: true },
      { id: "gender", label: "I am a", type: "single", options: ["Man", "Woman"], required: true },
      { id: "seeking", label: "I am looking for a", type: "single", options: ["Woman", "Man"], required: true },
      {
        id: "area",
        label: "Where in San Diego do you live?",
        type: "single",
        options: ["El Cajon", "La Mesa", "Rancho San Diego", "Spring Valley", "Santee / Lakeside", "Chula Vista / South Bay", "Central San Diego", "North County", "Outside San Diego County"],
        required: true,
      },
      { id: "height", label: "Height", type: "text", help: "For example 5'10\"" },
      { id: "marital_history", label: "Marital history", type: "single", options: ["Never married", "Divorced", "Widowed", "Separated"], required: true },
      { id: "has_children", label: "Do you have children?", type: "single", options: ["No", "Yes, they live with me", "Yes, they do not live with me"], required: true },
      {
        id: "photo",
        label: "A clear photo of your face",
        type: "photo",
        required: true,
        privateField: true,
        help: "Recent, facing the camera, good lighting, no sunglasses or filters. Only our matchmaking team can see it.",
      },
    ],
  },
  {
    id: "heritage",
    title: "Heritage and language",
    questions: [
      {
        id: "background",
        label: "Your background",
        type: "single",
        options: ["Chaldean", "Assyrian", "Iraqi Arab", "Lebanese", "Syrian", "Palestinian", "Jordanian", "Egyptian", "Yemeni", "Other Arab", "Mixed", "Other"],
        required: true,
      },
      { id: "background_other", label: "If mixed or other, tell us more", type: "text" },
      { id: "born", label: "Where were you born?", type: "single", options: ["United States", "Iraq", "Lebanon", "Syria", "Jordan", "Another Middle Eastern country", "Elsewhere"], required: true },
      { id: "languages", label: "Languages you speak", type: "multi", options: ["English", "Arabic", "Sureth / Chaldean (Sura)", "Spanish", "French", "Other"], required: true },
      {
        id: "partner_background",
        label: "Partner background preference",
        type: "single",
        options: ["Same background as me only", "Chaldean or Arab, either is fine", "Prefer my community but open", "Open to anyone"],
        required: true,
      },
      { id: "partner_language", label: "How important is it that your partner speaks your family's language?", type: "scale", scale: ["Not important", "Essential"], required: true },
    ],
  },
  {
    id: "faith",
    title: "Faith",
    intro: "Optional but very helpful. We only use this to find people who share your values.",
    questions: [
      {
        id: "religion",
        label: "Religion",
        type: "single",
        options: ["Chaldean Catholic", "Other Catholic", "Assyrian Church of the East", "Orthodox Christian", "Protestant / Evangelical", "Muslim (Sunni)", "Muslim (Shia)", "Other", "Not religious", "Prefer not to say"],
      },
      { id: "practice", label: "How religious are you in daily life?", type: "scale", scale: ["Not practicing", "Very practicing"] },
      {
        id: "partner_religion",
        label: "Your partner's faith",
        type: "single",
        options: ["Must share my faith", "Prefer the same faith", "Doesn't matter"],
      },
      { id: "church_mosque", label: "Do you attend church or mosque regularly?", type: "single", options: ["Weekly or more", "A few times a month", "Holidays and occasions", "Rarely or never"] },
    ],
  },
  {
    id: "family",
    title: "Family and future",
    questions: [
      { id: "timeline", label: "When would you ideally like to be engaged or married?", type: "single", options: ["Within 1 year", "1 to 2 years", "2 to 4 years", "When it feels right"], required: true },
      { id: "wants_children", label: "Do you want (more) children?", type: "single", options: ["Yes", "No", "Not sure"], required: true },
      { id: "partner_children_ok", label: "Open to a partner who already has children?", type: "single", options: yesNoOpen, required: true },
      { id: "family_involvement", label: "How involved will your family be in choosing your partner?", type: "scale", scale: ["My decision only", "Very involved"], required: true },
      { id: "family_closeness", label: "How close do you want to live to your family after marriage?", type: "single", options: ["Same house or very close", "Same city", "Anywhere is fine"] },
      { id: "traditional", label: "Where are you on traditional vs. modern values?", type: "scale", scale: ["Very modern", "Very traditional"], required: true },
      { id: "roles", label: "After marriage, how do you see work and home responsibilities?", type: "single", options: ["Both work and share home equally", "Both work, one leads at home", "One works, one focuses on home", "Flexible, we decide together"] },
    ],
  },
  {
    id: "career",
    title: "Education and career",
    questions: [
      { id: "education", label: "Highest education", type: "single", options: ["High school", "Some college", "Associate", "Bachelor's", "Master's", "Doctorate / professional (MD, JD, PharmD)", "Trade certification"], required: true },
      { id: "occupation", label: "What do you do for work?", type: "text", required: true },
      { id: "ambition", label: "How career-driven are you?", type: "scale", scale: ["Work to live", "Very ambitious"] },
      { id: "partner_education", label: "How important is your partner's education level?", type: "scale", scale: ["Not important", "Very important"] },
      { id: "money", label: "Your approach to money", type: "single", options: ["Saver", "Balanced", "Spender", "Investor / entrepreneur mindset"] },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    questions: [
      { id: "smoking", label: "Do you smoke (cigarettes, vape or hookah)?", type: "single", options: ["Never", "Hookah socially", "Occasionally", "Regularly"], required: true },
      { id: "drinking", label: "Do you drink alcohol?", type: "single", options: ["Never", "Socially", "Regularly"], required: true },
      { id: "fitness", label: "How active are you?", type: "scale", scale: ["Not active", "Very active"] },
      { id: "social", label: "Your ideal weekend", type: "scale", scale: ["Quiet at home", "Out with friends and family"] },
      { id: "interests", label: "Interests", type: "multi", options: ["Family gatherings", "Cooking", "Fitness / gym", "Sports", "Travel", "Music / dancing", "Reading", "Faith activities", "Business / investing", "Fashion", "Outdoors / hiking", "Movies / shows", "Volunteering", "Art / design"] },
      { id: "pets", label: "Pets", type: "single", options: ["Love them", "Fine with them", "Prefer no pets"] },
    ],
  },
  {
    id: "personality",
    title: "Personality",
    questions: [
      { id: "introvert", label: "Introvert or extrovert?", type: "scale", scale: ["Introvert", "Extrovert"] },
      { id: "planner", label: "Planner or spontaneous?", type: "scale", scale: ["Spontaneous", "Planner"] },
      { id: "conflict", label: "In a disagreement, I usually", type: "single", options: ["Talk it out right away", "Need time, then talk", "Avoid conflict", "Ask family for advice"] },
      { id: "love_language", label: "How do you most feel loved?", type: "single", options: ["Words", "Quality time", "Gifts", "Acts of service", "Physical affection"] },
      { id: "humor", label: "How important is a shared sense of humor?", type: "scale", scale: ["Nice to have", "Essential"] },
    ],
  },
  {
    id: "partner",
    title: "Your ideal partner",
    questions: [
      { id: "age_min", label: "Youngest age you'd consider", type: "number", min: 18, max: 99, required: true },
      { id: "age_max", label: "Oldest age you'd consider", type: "number", min: 18, max: 99, required: true },
      { id: "partner_smoking_ok", label: "Okay with a partner who smokes or uses hookah?", type: "single", options: ["Yes", "Hookah only", "No"], required: true },
      { id: "relocate", label: "Open to a partner outside San Diego?", type: "single", options: ["Yes", "Maybe", "No"] },
      {
        id: "dealbreakers",
        label: "Absolute dealbreakers",
        type: "multi",
        options: ["Different religion", "Previously married", "Has children", "Doesn't want children", "Smokes", "Drinks", "Not close with family", "Lives far away"],
      },
      { id: "must_haves", label: "Three things your partner must have", type: "longtext", required: true },
    ],
  },
  {
    id: "words",
    title: "In your own words",
    questions: [
      { id: "about_me", label: "Tell us about yourself", type: "longtext", required: true, help: "How would your closest friends describe you?" },
      { id: "ideal_relationship", label: "Describe the relationship you want", type: "longtext", required: true },
      { id: "for_matchmaker", label: "Anything else our matchmaker should know?", type: "longtext", privateField: true },
    ],
  },
  {
    id: "consent",
    title: "Agreement",
    questions: [
      {
        id: "consent",
        label: "Please confirm",
        type: "multi",
        required: true,
        options: [
          "I am 18 or older and single",
          "My answers are true",
          "I agree to the Terms and Privacy Policy",
          "I consent to the team using my answers, including background and faith, to find matches, with help from AI tools reviewed by a person",
        ],
      },
    ],
  },
];

export const allQuestions = sections.flatMap((s) => s.questions);
export const questionById = Object.fromEntries(allQuestions.map((q) => [q.id, q]));

export type Answers = Record<string, string | string[] | number | undefined>;

export function ageFromDob(dob?: unknown): number | null {
  if (typeof dob !== "string" || !dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function isAnswered(q: Question, v: Answers[string]): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v)) {
    if (q.id === "consent") return v.length === (q.options?.length ?? 0);
    return v.length > 0;
  }
  return true;
}

export function missingRequired(answers: Answers, section?: Section): Question[] {
  const qs = section ? section.questions : allQuestions;
  return qs.filter((q) => q.required && !isAnswered(q, answers[q.id]));
}

export function validationErrors(answers: Answers): string[] {
  const errs: string[] = [];
  const age = ageFromDob(answers.dob);
  if (answers.dob && (age === null || age < 18)) errs.push("You must be 18 or older to join.");
  const min = Number(answers.age_min);
  const max = Number(answers.age_max);
  if (answers.age_min && answers.age_max && min > max) errs.push("Your youngest age must be lower than your oldest age.");
  return errs;
}
