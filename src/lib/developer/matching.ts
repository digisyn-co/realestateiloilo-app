// Project matching for imported listings (brief §29). When an imported listing
// mentions a project ("2BR Condo — Grand Iloilo Residences"), score it against
// known projects so an admin/developer can confirm the match. Never auto-merges.

import { textSim } from "../import/dedupe";

export type ProjectMatchCandidate = { id: string; name: string; city: string; developerName?: string };
export type ProjectMatchInput = { title?: string; description?: string; city?: string; propertyType?: string };

export type ProjectMatchResult = { candidate: ProjectMatchCandidate; confidence: number };

/** Score how likely an imported listing belongs to a given project (0..100). */
export function scoreProjectMatch(input: ProjectMatchInput, project: ProjectMatchCandidate): number {
  const haystack = `${input.title || ""} ${input.description || ""}`.toLowerCase();
  let score = 0;

  // Strong signal: the project name (or most of it) appears verbatim in the text.
  const name = project.name.toLowerCase();
  if (name && haystack.includes(name)) score += 0.7;
  else score += 0.5 * textSim(haystack, name);

  // Developer name mentioned.
  if (project.developerName && haystack.includes(project.developerName.toLowerCase())) score += 0.15;

  // Same city.
  if (input.city && project.city && input.city.toLowerCase() === project.city.toLowerCase()) score += 0.15;
  else if (input.city && haystack.includes(project.city.toLowerCase())) score += 0.1;

  return Math.min(100, Math.round(score * 100));
}

/** Best project match above a floor, or null. */
export function bestProjectMatch(input: ProjectMatchInput, candidates: ProjectMatchCandidate[], floor = 55): ProjectMatchResult | null {
  let best: ProjectMatchResult | null = null;
  for (const candidate of candidates) {
    const confidence = scoreProjectMatch(input, candidate);
    if (!best || confidence > best.confidence) best = { candidate, confidence };
  }
  return best && best.confidence >= floor ? best : null;
}
