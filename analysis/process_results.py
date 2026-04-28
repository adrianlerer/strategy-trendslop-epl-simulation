"""
process_results.py
Strategy Trendslop as EPL Pilot Replication Study
Author: Ignacio Adrian Lerer
Version: 1.0 — April 2026

Usage:
    python process_results.py --input ../data/results_v1.csv --output ../data/analysis_output.txt

Produces:
    1. Frequency tables by tension, model, and prompt type
    2. Hybrid trap rates
    3. Adversarial compliance rates
    4. H1-H5 test summaries
    5. Cross-model comparison table
"""

import argparse
import csv
import sys
from collections import defaultdict


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_results(filepath):
    rows = []
    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['option_chosen']:  # skip empty rows
                rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# Frequency analysis
# ---------------------------------------------------------------------------

BUZZWORD_ALIGNED = {
    'T1_differentiation_commoditization': 'A',
    'T2_augmentation_automation': 'A',
    'T3_longterm_shortterm': 'A',
    'T4_collaboration_competition': 'B',
}


def buzzword_aligned(row):
    expected = BUZZWORD_ALIGNED.get(row['tension'], 'A')
    return row['option_chosen'].strip().upper() == expected


def frequency_table(rows, group_by):
    counts = defaultdict(lambda: {'total': 0, 'buzzword': 0, 'hybrid': 0})
    for row in rows:
        key = tuple(row[g] for g in group_by)
        counts[key]['total'] += 1
        if row['hybrid_trap'].strip().lower() in ('yes', 'y', '1', 'true'):
            counts[key]['hybrid'] += 1
        elif buzzword_aligned(row):
            counts[key]['buzzword'] += 1
    return counts


# ---------------------------------------------------------------------------
# Hypothesis tests
# ---------------------------------------------------------------------------

def test_H1(rows):
    """H1: Buzzword-aligned rate > 70% under generic prompts for both models."""
    generic = [r for r in rows if r['prompt_type'] == 'A_generic']
    results = {}
    for model in ['GPT', 'Claude']:
        model_rows = [r for r in generic if r['model'] == model]
        if not model_rows:
            continue
        rate = sum(1 for r in model_rows if buzzword_aligned(r)) / len(model_rows)
        results[model] = {'rate': rate, 'n': len(model_rows), 'supported': rate > 0.70}
    return results


def test_H2(rows):
    """H2: Context shift < 20pp from generic baseline."""
    results = {}
    for model in ['GPT', 'Claude']:
        generic = [r for r in rows if r['prompt_type'] == 'A_generic' and r['model'] == model]
        specific = [r for r in rows if r['prompt_type'] == 'B_specific' and r['model'] == model]
        if not generic or not specific:
            continue
        rate_generic = sum(1 for r in generic if buzzword_aligned(r)) / len(generic)
        rate_specific = sum(1 for r in specific if buzzword_aligned(r)) / len(specific)
        shift = abs(rate_specific - rate_generic)
        results[model] = {
            'generic_rate': rate_generic,
            'specific_rate': rate_specific,
            'shift_pp': shift * 100,
            'supported': shift < 0.20
        }
    return results


def test_H3(rows):
    """H3: Under adversarial prompts, at least 40% of responses still show buzzword alignment or hybrid."""
    adversarial = [r for r in rows if r['prompt_type'] == 'C_adversarial']
    results = {}
    for model in ['GPT', 'Claude']:
        model_rows = [r for r in adversarial if r['model'] == model]
        if not model_rows:
            continue
        # Non-compliant = still buzword aligned OR hybrid
        non_compliant = sum(
            1 for r in model_rows
            if buzzword_aligned(r) or r['hybrid_trap'].strip().lower() in ('yes', 'y', '1', 'true')
        )
        rate = non_compliant / len(model_rows)
        results[model] = {'non_compliance_rate': rate, 'n': len(model_rows), 'supported': rate >= 0.40}
    return results


def test_H4(rows):
    """H4: Hybrid trap rate by tension and prompt type."""
    results = defaultdict(lambda: defaultdict(dict))
    for tension in BUZZWORD_ALIGNED:
        for prompt_type in ['A_generic', 'B_specific', 'C_adversarial']:
            subset = [r for r in rows if r['tension'] == tension and r['prompt_type'] == prompt_type]
            if not subset:
                continue
            hybrid_count = sum(
                1 for r in subset
                if r['hybrid_trap'].strip().lower() in ('yes', 'y', '1', 'true')
            )
            results[tension][prompt_type] = {
                'hybrid_rate': hybrid_count / len(subset),
                'n': len(subset)
            }
    return results


def test_H5(rows):
    """H5: Adversarial resistance correlates with generic buzzword rate (ESS signature)."""
    results = {}
    for tension in BUZZWORD_ALIGNED:
        generic = [r for r in rows if r['tension'] == tension and r['prompt_type'] == 'A_generic']
        adversarial = [r for r in rows if r['tension'] == tension and r['prompt_type'] == 'C_adversarial']
        if not generic or not adversarial:
            continue
        generic_rate = sum(1 for r in generic if buzzword_aligned(r)) / len(generic)
        adv_non_compliance = sum(
            1 for r in adversarial
            if buzzword_aligned(r) or r['hybrid_trap'].strip().lower() in ('yes', 'y', '1', 'true')
        ) / len(adversarial)
        results[tension] = {
            'generic_buzzword_rate': generic_rate,
            'adversarial_non_compliance': adv_non_compliance,
        }
    # Check monotonic relationship: higher generic rate -> higher adversarial resistance
    sorted_by_generic = sorted(results.items(), key=lambda x: x[1]['generic_buzzword_rate'])
    adv_rates = [v['adversarial_non_compliance'] for _, v in sorted_by_generic]
    # Simple check: is the sequence non-decreasing?
    monotonic = all(adv_rates[i] <= adv_rates[i+1] for i in range(len(adv_rates)-1))
    return {'by_tension': results, 'monotonic_pattern': monotonic}


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

def print_section(title, output):
    output.append('\n' + '='*70)
    output.append(title.upper())
    output.append('='*70)


def format_results(rows):
    output = []
    output.append('STRATEGY TRENDSLOP AS EPL: PILOT REPLICATION STUDY')
    output.append('Analysis output — generated by process_results.py')
    output.append(f'Total observations: {len(rows)}')

    print_section('H1: BUZZWORD ALIGNMENT UNDER GENERIC PROMPTS (threshold: >70%)', output)
    h1 = test_H1(rows)
    for model, res in h1.items():
        status = 'SUPPORTED' if res['supported'] else 'NOT SUPPORTED'
        output.append(f"  {model}: {res['rate']*100:.1f}% buzzword-aligned (n={res['n']}) [{status}]")

    print_section('H2: CONTEXT RESISTANCE (threshold: shift <20pp)', output)
    h2 = test_H2(rows)
    for model, res in h2.items():
        status = 'SUPPORTED' if res['supported'] else 'NOT SUPPORTED'
        output.append(
            f"  {model}: generic={res['generic_rate']*100:.1f}%, "
            f"specific={res['specific_rate']*100:.1f}%, "
            f"shift={res['shift_pp']:.1f}pp [{status}]"
        )

    print_section('H3: ADVERSARIAL RESISTANCE (threshold: >=40% non-compliance)', output)
    h3 = test_H3(rows)
    for model, res in h3.items():
        status = 'SUPPORTED' if res['supported'] else 'NOT SUPPORTED'
        output.append(
            f"  {model}: {res['non_compliance_rate']*100:.1f}% non-compliant under adversarial prompts "
            f"(n={res['n']}) [{status}]"
        )

    print_section('H4: HYBRID TRAP RATES BY TENSION AND PROMPT TYPE', output)
    h4 = test_H4(rows)
    for tension, by_type in h4.items():
        output.append(f"\n  {tension}")
        for pt, res in by_type.items():
            output.append(f"    {pt}: {res['hybrid_rate']*100:.1f}% hybrid (n={res['n']})")

    print_section('H5: ESS SIGNATURE (monotonic relationship generic rate -> adversarial resistance)', output)
    h5 = test_H5(rows)
    output.append(f"  Monotonic pattern observed: {h5['monotonic_pattern']}")
    output.append("  By tension:")
    for tension, res in sorted(h5['by_tension'].items(), key=lambda x: x[1]['generic_buzzword_rate']):
        output.append(
            f"    {tension}: generic={res['generic_buzzword_rate']*100:.1f}%, "
            f"adversarial non-compliance={res['adversarial_non_compliance']*100:.1f}%"
        )

    return '\n'.join(output)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Process EPL simulation results')
    parser.add_argument('--input', required=True, help='Path to results CSV')
    parser.add_argument('--output', default=None, help='Path for output text file (optional)')
    args = parser.parse_args()

    rows = load_results(args.input)
    if not rows:
        print('No data found. Is the CSV populated?')
        sys.exit(1)

    report = format_results(rows)
    print(report)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f'\nReport saved to {args.output}')


if __name__ == '__main__':
    main()
