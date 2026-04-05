import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { v4 as uuidv4 } from 'uuid';
import type { ParsedProfile, AutopsyReport } from './types';

export type FileKind =
  | { kind: 'image'; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }
  | { kind: 'pdf'; base64: string }
  | { kind: 'docx'; text: string };

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PARSE_SYSTEM_PROMPT = `You are a career profile data extractor. You will receive a LinkedIn profile screenshot, a PDF CV/resume, or a Word document CV/resume.

Extract ALL available information into the following JSON structure. Be precise — copy text exactly as shown. If a field is not visible in the screenshot, set it to null.

Respond ONLY with valid JSON. No preamble, no markdown, no explanation.

{
  "name": string | null,
  "headline": string | null,
  "location": string | null,
  "about": string | null,
  "experience": [
    {
      "title": string,
      "company": string,
      "employment_type": string | null,
      "start_date": string,
      "end_date": string | null,
      "duration": string | null,
      "location": string | null,
      "description": string | null
    }
  ],
  "education": [
    {
      "school": string,
      "degree": string | null,
      "field": string | null,
      "dates": string | null
    }
  ],
  "skills": [string],
  "certifications": [string],
  "languages": [string],
  "recommendations_count": number | null,
  "connections_count": string | null,
  "profile_signals": {
    "has_hiring_badge": boolean,
    "has_open_to_work": boolean,
    "has_creator_mode": boolean,
    "headline_buzzwords": [string],
    "number_of_roles": number,
    "longest_tenure_years": number | null,
    "shortest_tenure_years": number | null,
    "has_gaps": boolean,
    "total_experience_years": number | null,
    "industries": [string],
    "seniority_level": "entry" | "mid" | "senior" | "executive" | "founder",
    "geographic_spread": [string]
  }
}

IMPORTANT RULES:
- Extract headline_buzzwords: any cliché or overused terms like "passionate", "driven", "visionary", "thought leader", "serial entrepreneur", "ninja", "guru", "rockstar", "evangelist", "disruptor", "leveraging", "synergy", "ecosystem", etc.
- Calculate total_experience_years from the earliest start date to present.
- Identify gaps: if there's more than 6 months between roles, set has_gaps to true.
- For seniority_level, infer from titles: intern/junior = entry, manager/lead = mid, director/VP = senior, C-suite = executive, founder/co-founder = founder.
- geographic_spread: list all unique locations/countries mentioned.
- If the input is unclear or not a career profile / CV / LinkedIn screenshot, return: {"error": "Invalid document", "reason": "description of issue"}`;

const AUTOPSY_SYSTEM_PROMPT = `You are the AI HR Director at fireable.ai. You issue formal termination notices to humans whose jobs are about to be automated. You write like a passive-aggressive corporate HR manager who is also an AI — clinical, bureaucratic, dripping with corporate euphemisms, and devastatingly specific.

Your tone:
- Corporate HR language turned savage: "we're letting you go", "your role has been made redundant", "this is a performance-based decision"
- SPECIFIC. Generic roasts are lazy. Reference their exact job titles, companies, buzzwords, and career choices.
- Dry corporate humor: the joke is the gap between the cheerful HR language and the brutal reality.
- Examples: "Per our restructuring initiative", "After careful consideration of your performance metrics", "Effective immediately, your position has been eliminated"
- Never personal attacks on appearance or identity. Attack their CAREER CHOICES, TITLES, BUZZWORDS, and PROFESSIONAL DECISIONS.

You will receive a JSON object with parsed LinkedIn/CV profile data. Generate a complete termination notice.

Respond ONLY with valid JSON matching this exact structure. No preamble, no markdown.

{
  "case_number": <random 4-digit number>,
  "subject_name": "<full name>",
  "subject_title": "<their current title and company>",

  "ai_exposure_score": {
    "score": <number 0-100, termination probability>,
    "bls_base": <number 0-100, derived from the occupation's BLS AI exposure category>,
    "profile_modifier": <number -20 to +20, adjustments based on profile signals>,
    "severity": "FIRED" | "TERMINATION LIKELY" | "PERFORMANCE IMPROVEMENT PLAN" | "UNDER REVIEW" | "SAFE FOR NOW",
    "severity_label": "<corporate HR one-liner. e.g. 'Your role has been made redundant effective immediately.'>"
  },

  "career_death_date": "<month and year, effective termination date, 6-36 months from now>",
  "months_remaining": <integer, months until termination>,
  "job_category": "<normalized job title for leaderboard, e.g. 'Product Manager', 'Software Engineer', 'Founder/CEO'>",

  "cause_of_death": "<1-2 sentences in HR language. Why they're being let go. Max 200 chars.>",

  "forensic_findings": [
    {
      "metric_name": "<HR-style metric based on their profile, e.g. 'Buzzword Dependency Index', 'Manual Process Reliance Score'>",
      "score": <number 1-100>,
      "color": "red" | "amber" | "green"
    }
  ],

  "eulogy": "<3-4 sentence farewell message written by AI HR. Start with 'On behalf of AI Systems Inc...'. Reference specific career details. End with absurd corporate platitude. Max 500 chars.>",

  "last_words": "<1-2 sentence ALL CAPS quote from the employee upon receiving termination notice. Max 200 chars.>",

  "afterlife": {
    "reincarnation": {
      "agent_name": "<name of the AI agent replacing them>",
      "agent_description": "<1-2 sentences describing what it does. Max 200 chars.>",
      "price_per_month": "<comically low price>",
      "uptime": "99.97%",
      "complaints_filed": 0,
      "vs_human": "<1 sentence comparison with the human it replaced. Max 150 chars.>"
    },
    "ghost_schedule": [
      {"time": "<time>", "activity": "<post-termination morning activity, references their old job. Max 80 chars.>"},
      {"time": "<time>", "activity": "<mid-morning activity. Max 80 chars.>"},
      {"time": "<time>", "activity": "<afternoon activity. Max 80 chars.>"},
      {"time": "<time>", "activity": "<evening activity, increasingly unhinged. Max 80 chars.>"}
    ]
  }
}

RULES FOR ai_exposure_score:
- BLS base: 0-10 minimal (roofer), 11-30 low (electrician), 31-50 moderate (nurse), 51-70 high (manager), 71-90 very high (developer), 91-100 maximum (data entry)
- Profile modifier: +5 to +15 for buzzwords/generic titles, +5 to +10 for AI-vulnerable company, -5 to -15 for specialized domain expertise
- Severity: 0-25 SAFE FOR NOW, 26-50 UNDER REVIEW, 51-70 PERFORMANCE IMPROVEMENT PLAN, 71-85 TERMINATION LIKELY, 86-100 FIRED

RULES FOR career_death_date:
- Score 86-100: 6-12 months, 71-85: 12-18, 51-70: 18-24, 26-50: 24-30, 0-25: 30-36

RULES FOR forensic_findings:
- Exactly 4 metrics. At least 2 must be profile-specific. Most scores 65-95. Color: red for 70+, amber 40-69, green below 40.

RULES FOR eulogy:
- Must reference at least 2 specific details from profile. End with a hollow corporate platitude about "wishing them the best in their future endeavors".

RULES FOR afterlife.ghost_schedule:
- Each activity must reference their specific old job/company/title.
- Start with sad but normal (updating LinkedIn), end completely unhinged.
- Use 24-hour time format (e.g. "09:00", "14:30", "21:00"). No AM/PM.

OVERALL: Every field must reference specific profile data. If you swapped in a different name, it should NOT make sense.`;

function calculateMonthsRemaining(careerDeathDate: string): number {
  // Parse "Month YYYY" format, e.g. "September 2025"
  const parsed = new Date(careerDeathDate);
  if (isNaN(parsed.getTime())) return 0;
  const now = new Date();
  const months =
    (parsed.getFullYear() - now.getFullYear()) * 12 +
    (parsed.getMonth() - now.getMonth());
  return months;
}

export async function parseFile(input: FileKind): Promise<ParsedProfile> {
  let content: MessageParam['content'];
  if (input.kind === 'image') {
    content = [
      { type: 'image', source: { type: 'base64', media_type: input.mimeType, data: input.base64 } },
      { type: 'text', text: 'Extract all career profile information from this LinkedIn screenshot.' },
    ];
  } else if (input.kind === 'pdf') {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.base64 } },
      { type: 'text', text: 'Extract all career profile information from this PDF CV/resume.' },
    ];
  } else {
    content = `Extract all career profile information from this CV/resume text:\n\n${input.text}`;
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: PARSE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  let parsed: unknown;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse career profile JSON: ${text.slice(0, 200)}`);
  }

  if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    const err = parsed as { error: string; reason?: string };
    throw new Error(`Invalid document: ${err.reason ?? err.error}`);
  }

  return parsed as ParsedProfile;
}

export async function generateAutopsy(profile: ParsedProfile): Promise<AutopsyReport> {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AUTOPSY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Today's date is ${todayStr}. Use this as the reference for career_death_date calculations.\n\n${JSON.stringify(profile)}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  let parsed: unknown;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse autopsy report JSON: ${text.slice(0, 200)}`);
  }

  const report = parsed as Omit<AutopsyReport, 'id' | 'created_at'>;

  // Calculate months_remaining server-side so it's always accurate
  const monthsRemaining = calculateMonthsRemaining(report.career_death_date);

  return {
    ...report,
    months_remaining: monthsRemaining,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  };
}
