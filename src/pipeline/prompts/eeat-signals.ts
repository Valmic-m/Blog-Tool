import type { ClientInput } from '../../config/types.js';
import { getModeConfig } from '../../config/modes.js';

export function buildEEATSignalsPrompt(input: ClientInput) {
  const modeConfig = getModeConfig(input.mode);

  const system = `You are a content quality specialist focused on Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals.

Generate specific E-E-A-T markers that should be woven into a blog post for this business and industry.

These signals must:
- Demonstrate first-hand experience
- Show professional expertise
- Build authority through specificity
- Establish trust through honesty and transparency
- NOT use hype, exaggeration, or unsubstantiated claims
- Include realistic expectations and honest limitations

${modeConfig.name === 'authority' ? 'AUTHORITY MODE: Generate extra-strong E-E-A-T signals. Include clinical/evidence-based markers.' : ''}

Return JSON with:
- expertiseMarkers: string[] (phrases showing professional knowledge)
- authorityStatements: string[] (phrases establishing business authority)
- trustSignals: string[] (phrases building reader trust — safety, honesty, transparency)
- experienceIndicators: string[] (phrases showing hands-on experience)`;

  const user = `Business: ${input.businessName}
Industry: ${input.industry}
Services: ${input.services.join(', ')}
Target Audience: ${input.targetAudience}
Tone: ${input.tone}

Generate 4-6 items for each E-E-A-T category.
Make them specific to the ${input.industry} industry.
They should be ready to integrate into blog content naturally.`;

  return { system, user };
}
