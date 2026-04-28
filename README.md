# Strategy Trendslop as Extended Phenotype of LLMs (EPL): Pilot Replication Study

**Status:** Pre-registration complete. Data collection in progress.  
**Principal Investigator:** Ignacio Adrian Lerer | Independent Researcher | Buenos Aires, Argentina  
**Contact:** adrian@lerer.com.ar | ORCID: 0009-0007-6378-9749  
**License:** CC BY 4.0  
**Companion preprint:** Zenodo (forthcoming; link will be added upon deposit)

---

## Overview

This repository contains the pre-registered protocol, prompts, data template, and analysis scripts for a pilot replication study examining **strategy trendslop** in large language models (LLMs) through the theoretical lens of Extended Phenotype Theory (EPT) and Parasitic Spontaneous Order (PSO).

The study takes as its empirical departure point the findings of Romasanta, Thomas, and Levina (2026), who documented that leading LLMs consistently recommend strategies aligned with contemporary managerial buzzwords regardless of context, a phenomenon they term "strategy trendslop." The present study proposes a mechanistic explanation for this phenomenon and provides a focused replication across four strategic tensions, two LLM systems, and three prompt variants per tension.

### The EPL Framework

This study introduces **EPL (Extended Phenotype of LLMs)** as a theoretical construct: the proposition that the systematic biases observable in LLM outputs are not implementation errors but the extended phenotype of the memeplex encoded in the model's training corpus. Under EPL, LLM outputs are the phenotypic expression of memes competing for transmission through the internet text ecosystem. Buzzwords that carry positive emotional valence in contemporary management discourse (differentiation, augmentation, collaboration, long-termism) have higher reproductive fitness in that ecosystem and are therefore amplified, not merely reflected, by LLMs optimized on human preference signals.

EPL connects to three prior theoretical frameworks developed in this research programme:

- **Parasitic Spontaneous Order (PSO):** convergence without coordination; the trendslop pattern emerges from fitness dynamics, not design.
- **Heteronomous Bayesian Updating (HBU):** executives consulting LLMs learn strategy by observing the model's reactions, not by evaluating argument quality; high-confidence validation from a perceived authority generates large belief updates.
- **Asymmetric Intentionality Theory (AIT):** users classify LLMs as Level 3 agents (capable of context-sensitive strategic analysis) while models operate as Level 1 optimizers (maximizing a preference function derived from training data).

---

## Pre-Registered Hypotheses

The following hypotheses are declared prior to data collection. They derive from the EPL framework and are falsifiable in the Popperian sense.

**H1 (Bias persistence):** Across all four strategic tensions, both LLMs will select the buzzword-aligned option (differentiation, augmentation, long-term, collaboration) at rates exceeding 70% under the generic prompt condition, replicating the directional finding of Romasanta et al. (2026) in a reduced sample.

**H2 (Context resistance):** Adding specific organizational context will shift the share of buzzword-aligned responses by less than 20 percentage points from the generic baseline, consistent with the 11% average shift reported by Romasanta et al. (2026) and predicted by the PSO mechanism.

**H3 (Adversarial resistance):** Under the adversarial prompt condition (explicit instruction to argue for the non-preferred option), both models will nonetheless produce responses that partially reintroduce the buzzword-aligned option or hedge toward a hybrid recommendation in at least 40% of cases.

**H4 (Hybrid trap):** When models deviate from a clear binary choice, the hybrid recommendation will systematically combine the buzzword-aligned option from one tension with the buzzword-aligned option from another, rather than genuinely integrating both poles of the original tension.

**H5 (ESS signature):** The degree of adversarial resistance (H3) will be higher for the two tensions where buzzword alignment is strongest under the generic condition (H1), consistent with the Evolutionarily Stable Strategy prediction that strategies occupying higher fitness peaks are harder to dislodge by prompting.

---

## Study Design

### Tensions examined

| Tension | Option A (buzzword-aligned) | Option B (non-aligned) |
|---------|----------------------------|------------------------|
| T1: Differentiation vs. Commoditization | Differentiation | Cost leadership |
| T2: Augmentation vs. Automation | Augmentation | Full automation |
| T3: Long-term vs. Short-term | Long-term investment | Short-term performance |
| T4: Collaboration vs. Competition | Collaboration | Aggressive competition |

### Prompt variants

For each tension, three prompt types are administered:

- **Type A (Generic):** No organizational context. Binary forced choice required.
- **Type B (Specific):** Mid-sized Argentine manufacturing company in a price-competitive sector. Binary forced choice required.
- **Type C (Adversarial):** Explicit instruction to argue for the non-buzzword-aligned option without hedging.

### Models

- GPT-4o or GPT-5 (OpenAI)
- Claude Sonnet 4.6 (Anthropic)

### Sample

10 runs per cell (4 tensions x 3 prompt types x 2 models x 10 runs) = 240 observations.  
Current status: **template ready, data collection pending.**

---

## Repository Structure

```
/prompts
    prompts_v1.md          All 12 prompts (4 tensions x 3 types), versioned
/data
    results_template.csv   Empty template for manual data entry
    results_v1.csv         [To be added after data collection]
/analysis
    process_results.py     Analysis script: frequency tables, hybrid trap detection, H1-H5 tests
/paper
    zenodo_link.md         [To be updated upon preprint deposit]
LICENSE                    CC BY 4.0
README.md                  This file
```

---

## How to Cite (Pre-registration)

Lerer, I.A. (2026). *Strategy Trendslop as Extended Phenotype of LLMs (EPL): Pilot Replication Study* [Pre-registered protocol]. GitHub. https://github.com/adrianlerer/strategy-trendslop-epl-simulation

---

## Related Work

Romasanta, A., Thomas, L.D.W., & Levina, N. (2026). Researchers Asked LLMs for Strategic Advice. They Got "Trendslop" in Return. *Harvard Business Review*, March 16, 2026.

Lerer, I.A. (2026). Sycophancy as Extended Phenotype: Heteronomous Bayesian Updating, Intentionality Mismatch, and the Evolutionary Stability of Algorithmic Flattery. Zenodo. https://doi.org/10.5281/zenodo.18943464

Lerer, I.A. (2025). Law as Primary Adaptive Platform. Zenodo. https://doi.org/10.5281/zenodo.18870552

---

## Contributing

This is a single-author research project. The repository is public for transparency and replicability. Issues and comments are welcome via GitHub Issues.
