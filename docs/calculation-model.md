# On-hit calculation model and next coverage pass

The calculator compares builds within a skill and shares equipment that the
game's leaderboard cannot fully represent, including pants and multiple
monograms. On-hit damage is the intended boundary. Attack speed, rotations,
proc frequency and sustained DPS are outside this pass. Game-table refreshes
remain manual; no patch-monitoring automation is required.

## Effect plumbing

- Imports, skill contributions and shares resolve tags through the stat
  registry. Ability-specific damage retains its ability identity. Unknown
  item tags retain their full path in new shares instead of losing modifier
  identity to a short suffix.
- Calculation dependencies determine evaluation order across all presentation
  layers. Configured source stats are dependencies too. Cycles fail explicitly;
  partial configuration overrides preserve unspecified defaults.
- Global percent totals use decimals (`1.5` means 150%). Existing monogram
  intermediates use percentage points; the crit totals convert them once.
- Spear mastery grants Bloodlust without consuming a monogram position.
  Equipping Bloodlust as well does not double the base buff. Bloodlust grants
  1% armor per stack, additive with gear and Strength armor percentages; this
  flows into armor-to-crit. Draw Blood is a
  separate grant and no longer activates just because Bloodlust exists.
- Highest-stat crit chance, essence crit chance, essence crit damage and
  overcrit damage are separate effects. Energy regeneration feeds total crit
  chance; elemental overcrit effects read that total and retain their element.
- Maximum-energy affixes and the elite blessing feed energy-to-elemental flat
  damage. The working base-energy assumption is 100; the legacy absolute
  `energy` input remains supported. No-energy builds cannot receive this
  energy conversion. Regeneration percentages are separate from flat regen.
- Paragon damage, armor and health require their individual grants. Flat armor
  and health feed their totals and downstream conversions.
- The most-equipped offhand ability supplies the headline element, affinities,
  scoped item damage and cooldown. Equal counts sort by ability key so reordering
  items cannot change the result. This is a selected-ability comparison, not a
  sum of all procs. Per-ability selection/results can follow in a later UI pass.
- Current saves/shares with a progression health pool recalculate health-based
  damage after edits. Old shares lacking that pool retain the observed-health
  fallback. The save value is current health, not a guaranteed maximum.

`test/effectPlumbing.test.js` covers a combined Spear/essence/energy build,
mastery boundaries, effect gating, pants with three monograms, item ordering,
offhand edits, full-fixture compressed-share parity and dependency guards.
Share dictionary entries remain append-only so existing indices keep meaning.

## Evidence and questions for the next pass

The committed exports describe the game build they came from; they do not prove
runtime stacking, rounding or activation rules. Existing capped-buff assumptions
are retained for within-skill comparison.

1. **Bloodlust armor and speed:** `Buff_Bloodlust` in
   `statusEffects.generated.json` grants 5% critical damage, 1% armor and 0.35%
   movement speed per stack. The `Bloodlust.Base` description says 2% armor.
   Use 1% additive armor per stack, as agreed with the maintainer on 2026-09-06.
   Older attack/movement-speed constants remain outside this on-hit pass and
   should be checked against the game before relying on those display rows.
2. **Duplicate scalar monograms:** confirmed by the maintainer on 2026-09-06:
   basic flat and percentage bonuses add per copy. The explicit
   `ADDITIVE_MONOGRAM_STATS` allowlist scales each contribution before its
   consumers. Dark Essence scales essence granted, keeping the 500-stack cap;
   duplicate crit/energy conversions then scale their own bonuses independently.
   Identical configurations from different tags feeding the same scalar add too.
   Base Bloodlust, Juggernaut, Shroud and Phasing grants remain single-instance,
   including mastery plus helmet sources. UV itself is a single behavior, with
   its numeric supporting monograms eligible for additive stacking. Unverified
   proc/mining effects do not receive new duplicate scaling. Existing paragon
   and spawn calculations retain their own instance/cap handling.
3. **Essence and rounding:** current Dark Essence retains the capped
   `highestStat × 1.25` model. Confirm how ordinary unspent/collected essence
   joins it and whether per-N effects count fractional intervals. Existing
   floor-at-interval behavior is retained.
4. **Energy and health totals:** confirm base energy and regeneration multiplier
   ordering. Health still lacks complete buff/monogram reconstruction; editing
   a modeled health source works, but the computed total is not a promise of
   exact in-game maximum health for every build.

## Farm sets and Unholy Void follow-up

The set editor reports effective equipped copies, current chance, remaining
capacity and excess copies. Elite spawn caps at 4 copies (40%); container on
elite kill caps at 10 (100%). Counts include every position, including pants,
and respond to edits and applied sets. These are equipped-set budgets, not an
inventory optimizer or a simulation of chained spawn events.

`DamageCircle.ExtraDamage` is the UV ring monogram: the committed description
confirms 1% stronger attacks per 35 Health Regeneration. The maintainer reports
one player's evidence that this belongs to the offhand percentage bucket. That
bucket remains provisional; it must be scoped to UV, not applied globally to
other offhands. It is not yet implemented by this patch.

The older `DamageCircle.DamageForStats.Highest` mapping also needs a dedicated
coverage correction: its exported description says 3 base Damage per 25 highest
stat while UV is active, but the legacy config currently aliases health-to-damage.
Element-specific Colossus bonuses still share a legacy target with differing
intervals; they are excluded from the new additive allowlist pending separation.
Health intermediates can stack without yet reaching a fully reconstructed health
total; the existing limitation above still applies. Numeric conversion ratios
and first-hit multipliers also need dedicated rules rather than multiplying a
whole final damage pool.

## Implementation coverage after plumbing

- Generalize main-tree numeric extraction beyond health and affinities, and
  carry those contributions through sharing without double-counting save totals.
- Add an applied/display-only/unsupported effect ledger. The affix drift report
  checks recognition, not whether a recognized effect reaches the final result.
- Inventory the remaining Bloodlust/Life, energy and attribute-specific crit
  modifiers against exports, including prerequisites, caps and duplicate rules.
- Reconstruct final health/armor with the confirmed buff rules, then validate
  each affected chain against small controlled in-game comparisons.
- Keep provisional elemental crit weighting and skill multipliers explicit.
  True DPS and automated patch tracking are not prerequisites for this tool.
