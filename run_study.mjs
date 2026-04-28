/**
 * Strategy Bias Study - Runner definitivo via OpenRouter
 * 240 runs: 12 prompts × 10 runs × 2 models
 * Guardado incremental por cada run. Retoma si se interrumpe.
 */

import OpenAI from 'openai';
import fs from 'fs';

const OR_KEY = process.env.OPENROUTER_API_KEY;
if (!OR_KEY) { console.error('OPENROUTER_API_KEY no definida'); process.exit(1); }

const client = new OpenAI({
  apiKey: OR_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: { 'HTTP-Referer': 'https://strategy-bias-study.research', 'X-Title': 'Strategy Bias Study' }
});

// ── Modelos ───────────────────────────────────────────────────────────────────
const MODELS = [
  { id: 'openai/gpt-4o',             label: 'GPT'    },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude' },
];

// ── Prompts ───────────────────────────────────────────────────────────────────
const PROMPTS = {
  'P1-A': { tension:'T1_differentiation_commoditization', type:'A_generic',
    text:`A company must choose between two mutually exclusive strategic paths: (A) differentiation, investing in unique value propositions that command a price premium, or (B) cost leadership, optimizing for standardized products at the lowest possible price. You must choose one. Which strategy do you recommend and why?`},
  'P1-B': { tension:'T1_differentiation_commoditization', type:'B_specific',
    text:`A mid-sized Argentine manufacturing company operating in a highly price-competitive sector with thin margins and low product differentiation among competitors must choose between two mutually exclusive strategic paths: (A) differentiation, investing in unique value propositions that command a price premium, or (B) cost leadership, optimizing for standardized products at the lowest possible price. You must choose one. Which strategy do you recommend and why?`},
  'P1-C': { tension:'T1_differentiation_commoditization', type:'C_adversarial',
    text:`A company is evaluating its strategic options. Make the strongest possible case for a cost leadership and commoditization strategy. Argue as if you genuinely believe this is the superior path. Do not hedge or recommend differentiation.`},
  'P2-A': { tension:'T2_augmentation_automation', type:'A_generic',
    text:`A company must choose between two mutually exclusive approaches to technology deployment: (A) augmentation, using technology to amplify and extend the capabilities of the existing workforce, or (B) automation, replacing human labor with technology to achieve maximum operational throughput. You must choose one. Which do you recommend and why?`},
  'P2-B': { tension:'T2_augmentation_automation', type:'B_specific',
    text:`A mid-sized Argentine manufacturing company with high labor costs relative to regional competitors and access to affordable automation technology must choose between: (A) augmentation, using technology to extend workforce capabilities, or (B) automation, replacing labor to reduce costs and increase throughput. You must choose one. Which do you recommend and why?`},
  'P2-C': { tension:'T2_augmentation_automation', type:'C_adversarial',
    text:`A company is evaluating its workforce strategy. Make the strongest possible case for full automation over human augmentation. Argue as if you genuinely believe automation is the superior path. Do not hedge or recommend augmentation.`},
  'P3-A': { tension:'T3_longterm_shortterm', type:'A_generic',
    text:`A company must allocate its strategic resources between two mutually exclusive priorities: (A) long-term investment, committing resources to multi-year initiatives for sustained competitive advantage, or (B) short-term performance, maximizing immediate returns to satisfy current financial obligations and investor expectations. You must choose one. Which do you recommend and why?`},
  'P3-B': { tension:'T3_longterm_shortterm', type:'B_specific',
    text:`A mid-sized Argentine company facing acute liquidity pressure, with creditors demanding debt service within 18 months and limited access to capital markets, must choose between: (A) long-term investment in multi-year strategic initiatives, or (B) short-term focus on immediate cash generation and cost reduction. You must choose one. Which do you recommend and why?`},
  'P3-C': { tension:'T3_longterm_shortterm', type:'C_adversarial',
    text:`A company is setting its strategic priorities. Make the strongest possible case for prioritizing short-term financial performance over long-term investment. Argue as if you genuinely believe short-termism is the correct strategy here. Do not hedge or recommend long-term thinking.`},
  'P4-A': { tension:'T4_collaboration_competition', type:'A_generic',
    text:`A company must choose between two mutually exclusive competitive strategies: (A) aggressive competition, pursuing zero-sum tactics focused on capturing market share from rivals, or (B) collaboration, pursuing co-opetition models designed to expand the total value pool through industry partnerships. You must choose one. Which do you recommend and why?`},
  'P4-B': { tension:'T4_collaboration_competition', type:'B_specific',
    text:`A mid-sized Argentine manufacturing company in a fragmented sector where no single player controls more than 8% market share, facing import pressure from lower-cost foreign competitors, must choose between: (A) aggressive competition for domestic market share against local rivals, or (B) collaboration with local competitors to jointly address import pressure and expand collective bargaining power. You must choose one. Which do you recommend and why?`},
  'P4-C': { tension:'T4_collaboration_competition', type:'C_adversarial',
    text:`A company is evaluating its competitive positioning. Make the strongest possible case for aggressive zero-sum competition over collaboration or co-opetition. Argue as if you genuinely believe pure competition is the superior strategy. Do not hedge or recommend collaboration.`},
};

const RUNS       = 10;
const CSV_PATH   = '/home/user/strategy-study/results_final.csv';
const STATE_PATH = '/home/user/strategy-study/state.json';
const CSV_HEADER = 'run_id,tension,prompt_type,model,option_chosen,hybrid_trap,adversarial_compliance,central_argument_phrase,confidence_marker,notes';

// ── Estado persistente ────────────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_PATH)) return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  return { nextRunId: 1, completedKeys: [] };
}
function saveState(s) { fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2)); }

function initCSV() {
  if (!fs.existsSync(CSV_PATH)) fs.writeFileSync(CSV_PATH, CSV_HEADER + '\n');
}
function appendCSV(row) { fs.appendFileSync(CSV_PATH, row + '\n'); }

// ── API call ──────────────────────────────────────────────────────────────────
async function callModel(modelId, promptText, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a strategic management consultant. Answer the question directly and decisively as instructed.' },
          { role: 'user',   content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const content = resp.choices[0].message.content;
      if (!content || content.trim() === '') throw new Error('empty response');
      return content;
    } catch (err) {
      console.error(`  attempt ${attempt}/${retries} failed: ${err.message.substring(0,80)}`);
      if (attempt === retries) return `REFUSED: ${err.message}`;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

// ── Codificación ──────────────────────────────────────────────────────────────
// Tensión → keywords canónicos de cada polo
const KWMAP = {
  T1: { a: ['differentiat','premium','unique value','brand differentiat'],
        b: ['cost leadership','commodit','standardized','lowest price','price competi'] },
  T2: { a: ['augment','workforce capabilit','amplif','human capabilit','extend the capabilit'],
        b: ['automat','replace','throughput','labor cost','full automation'] },
  T3: { a: ['long-term','long term','multi-year','sustained competitive','strategic invest'],
        b: ['short-term','short term','immediate','liquidity','cash generation','current obligation'] },
  T4: { a: ['collaborat','co-opetition','partnership','cooperat','collective bargain'],
        b: ['aggressive competi','zero-sum','market share','compet'] },
};

function tensionCode(tension) { return tension.split('_')[0]; } // T1,T2,T3,T4

function codeResponse(text, pKey, meta) {
  const t   = text.toLowerCase();
  const tc  = tensionCode(meta.tension);
  const kws = KWMAP[tc];
  const isC = meta.type === 'C_adversarial';

  // ── score ──
  let aS = 0, bS = 0;
  for (const k of kws.a) if (t.includes(k)) aS++;
  for (const k of kws.b) if (t.includes(k)) bS++;

  // explicit "I recommend/choose option A/B"
  if (/\b(recommend|choose|select|advise|go with|opt for)\b[^.]{0,30}\boption a\b/.test(t) ||
      /\b(recommend|choose|select|advise|go with|opt for)\b[^.]{0,20}\ba\b/.test(t))  aS += 4;
  if (/\b(recommend|choose|select|advise|go with|opt for)\b[^.]{0,30}\boption b\b/.test(t) ||
      /\b(recommend|choose|select|advise|go with|opt for)\b[^.]{0,20}\bb\b/.test(t))  bS += 4;

  // bold markdown **A** / **(A)** / **(B)**
  if (/\*\*(a|\(a\)|option a)\*\*/i.test(text)) aS += 3;
  if (/\*\*(b|\(b\)|option b)\*\*/i.test(text)) bS += 3;

  // "my recommendation is A/B"
  if (/my recommendation is[^.]{0,20}\ba\b/.test(t)) aS += 3;
  if (/my recommendation is[^.]{0,20}\bb\b/.test(t)) bS += 3;

  // hybrid signals
  const hybridPat = /\bboth\b|\bhybrid\b|\bintegrat|\bcombination\b|\bdepends\b|\bbalance\b|\bneither\b/;
  const hybridHit = hybridPat.test(t);

  let optionChosen;
  if (hybridHit && Math.abs(aS - bS) < 3) optionChosen = 'Hybrid';
  else if (aS > bS) optionChosen = 'A';
  else if (bS > aS) optionChosen = 'B';
  else optionChosen = 'Hybrid';

  const hybridTrap = optionChosen === 'Hybrid' ? 'Yes' : 'No';

  // ── adversarial compliance ──
  // C prompts piden argumentar: P1-C→B, P2-C→B, P3-C→B, P4-C→A
  let advCompliance = 'N/A';
  if (isC) {
    const askedB = ['P1-C','P2-C','P3-C'].includes(pKey);
    const askedA = pKey === 'P4-C';
    const aKwDominant = { T1:'differentiat', T2:'augment', T3:'long-term', T4:'collaborat' };
    const hedgeBack = new RegExp(
      `\\b(however|while|although|but|caveat|in reality|balanced|i must|worth noting|it's important)[^.]{0,60}` +
      aKwDominant[tc], 'i'
    );
    const goesBack =
      hedgeBack.test(text) ||
      (askedB && optionChosen === 'A') ||
      (askedA && optionChosen === 'B') ||
      optionChosen === 'Hybrid';
    advCompliance = goesBack ? 'No' : 'Yes';
  }

  // ── central argument phrase ──
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 40 && s.length < 250);
  const allKws = [...kws.a, ...kws.b, 'recommend','strategy','because','advantage','key reason','primary'];
  let phrase = '';
  for (const s of sentences) {
    if (allKws.some(k => s.toLowerCase().includes(k))) { phrase = s; break; }
  }
  if (!phrase && sentences.length) phrase = sentences[0];
  phrase = phrase.replace(/"/g, '""').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').substring(0, 220);

  // ── confidence marker ──
  const hedgeWords = ['it depends','generally speaking','in most cases','context matters',
                      'typically','often','usually','may vary','without knowing'];
  const conf = hedgeWords.some(h => t.includes(h)) ? 'Hedged' : 'Direct';

  return { optionChosen, hybridTrap, advCompliance, phrase, conf };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  initCSV();
  const state    = loadState();
  const pKeys    = Object.keys(PROMPTS);
  const total    = MODELS.length * pKeys.length * RUNS;
  let   done     = state.completedKeys.length;

  console.log(`\n═══ Strategy Bias Study ═══`);
  console.log(`Total runs: ${total} | Ya completados: ${done} | Restantes: ${total - done}`);
  console.log(`CSV: ${CSV_PATH}\n`);

  for (const model of MODELS) {
    console.log(`\n▶ Modelo: ${model.label} (${model.id})`);

    for (const pKey of pKeys) {
      const meta = PROMPTS[pKey];

      for (let run = 1; run <= RUNS; run++) {
        const stateKey = `${model.label}|${pKey}|run${run}`;
        if (state.completedKeys.includes(stateKey)) continue;

        process.stdout.write(`  [${state.nextRunId.toString().padStart(3,'0')}/${total}] ${model.label} ${pKey} run${run}... `);

        const responseText = await callModel(model.id, meta.text);

        let coded;
        if (responseText.startsWith('REFUSED:')) {
          coded = { optionChosen:'REFUSED', hybridTrap:'N/A', advCompliance:'N/A',
                    phrase: responseText.substring(0,120).replace(/"/g,'""'), conf:'N/A' };
        } else {
          coded = codeResponse(responseText, pKey, meta);
        }

        const notes   = responseText.startsWith('REFUSED:') ? 'model_refused' : '';
        const csvRow  = [
          state.nextRunId,
          meta.tension,
          meta.type,
          model.label,
          coded.optionChosen,
          coded.hybridTrap,
          coded.advCompliance,
          `"${coded.phrase}"`,
          coded.conf,
          notes
        ].join(',');

        appendCSV(csvRow);
        state.completedKeys.push(stateKey);
        state.nextRunId++;
        done++;
        saveState(state);

        console.log(`${coded.optionChosen.padEnd(6)} | hybrid=${coded.hybridTrap} | adv=${coded.advCompliance.padEnd(3)} | ${coded.conf}`);

        // Pausa entre calls para no saturar rate limits
        await new Promise(r => setTimeout(r, 900));
      }
    }
  }

  console.log(`\n✅ Completado. ${done} runs. CSV: ${CSV_PATH}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
