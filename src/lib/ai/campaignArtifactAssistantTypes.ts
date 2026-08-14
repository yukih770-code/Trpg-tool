export type CampaignArtifactTask = 'preparation_brief' | 'campaign_recap';
export type CampaignArtifactSourceFamily = 'campaign_summary' | 'actor_summaries' | 'room_summaries' | 'prior_artifacts';
export type CampaignArtifactSourceKind = 'campaign_summary' | 'campaign_actor_summary' | 'campaign_room_summary' | 'prior_artifact';

export type CampaignArtifactSource = {
  sourceId: string;
  sourceKind: CampaignArtifactSourceKind;
  sourceRefId: string;
  title: string;
  excerpt: string;
  updatedAt?: string;
};

export type CampaignArtifactSection = { heading: string; body: string; sourceIds: string[] };

export type CampaignArtifactSuggestion = {
  version: 1;
  task: CampaignArtifactTask;
  title: string;
  summary: string;
  sections: CampaignArtifactSection[];
  uncertainties: string[];
  suggestedNextSteps: string[];
};

export type CampaignArtifactSuggestionResult = {
  suggestionId: string;
  task: CampaignArtifactTask;
  provider: string;
  route: 'local';
  model: string;
  createdAt: number;
  expiresAt: number;
  sources: CampaignArtifactSource[];
  suggestion: CampaignArtifactSuggestion;
};

export type SavedCampaignArtifact = {
  artifactId: string;
  task: CampaignArtifactTask;
  title: string;
  summary?: string;
  visibility: 'user_private';
  suggestion: CampaignArtifactSuggestion;
  sources: CampaignArtifactSource[];
  model?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export const CAMPAIGN_ARTIFACT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'task', 'title', 'summary', 'sections', 'uncertainties', 'suggestedNextSteps'],
  properties: {
    version: { const: 1 },
    task: { enum: ['preparation_brief', 'campaign_recap'] },
    title: { type: 'string', minLength: 1, maxLength: 160 },
    summary: { type: 'string', minLength: 1, maxLength: 1200 },
    sections: {
      type: 'array', minItems: 1, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['heading', 'body', 'sourceIds'],
        properties: {
          heading: { type: 'string', minLength: 1, maxLength: 120 },
          body: { type: 'string', minLength: 1, maxLength: 3000 },
          sourceIds: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 200 } },
        },
      },
    },
    uncertainties: { type: 'array', maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 500 } },
    suggestedNextSteps: { type: 'array', maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 500 } },
  },
} as const;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= max ? text : null;
}

function textList(value: unknown, maxItems: number, maxLength: number, allowEmpty = true): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0)) return null;
  const parsed = value.map((item) => boundedText(item, maxLength));
  return parsed.every((item): item is string => item !== null) ? [...new Set(parsed)] : null;
}

export function isCampaignArtifactTask(value: unknown): value is CampaignArtifactTask {
  return value === 'preparation_brief' || value === 'campaign_recap';
}

export function isCampaignArtifactSourceFamily(value: unknown): value is CampaignArtifactSourceFamily {
  return value === 'campaign_summary' || value === 'actor_summaries' || value === 'room_summaries' || value === 'prior_artifacts';
}

export function parseCampaignArtifactSuggestion(value: unknown): CampaignArtifactSuggestion | null {
  const root = object(value);
  if (!root || root.version !== 1 || !isCampaignArtifactTask(root.task)) return null;
  const title = boundedText(root.title, 160);
  const summary = boundedText(root.summary, 1200);
  const uncertainties = textList(root.uncertainties, 12, 500);
  const suggestedNextSteps = textList(root.suggestedNextSteps, 12, 500);
  if (!title || !summary || !uncertainties || !suggestedNextSteps || !Array.isArray(root.sections) || root.sections.length < 1 || root.sections.length > 8) return null;
  const sections: CampaignArtifactSection[] = [];
  for (const value of root.sections) {
    const section = object(value);
    if (!section) return null;
    const heading = boundedText(section.heading, 120);
    const body = boundedText(section.body, 3000);
    const sourceIds = textList(section.sourceIds, 12, 200, false);
    if (!heading || !body || !sourceIds) return null;
    sections.push({ heading, body, sourceIds });
  }
  return { version: 1, task: root.task, title, summary, sections, uncertainties, suggestedNextSteps };
}

export function validateCampaignArtifactCitations(suggestion: CampaignArtifactSuggestion, sources: CampaignArtifactSource[]): boolean {
  const allowed = new Set(sources.map((source) => source.sourceId));
  return suggestion.sections.every((section) => section.sourceIds.length > 0 && section.sourceIds.every((sourceId) => allowed.has(sourceId)));
}
