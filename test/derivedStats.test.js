/**
 * Derived Stats Calculation Tests
 *
 * Tests the layer-based stat calculation system including:
 * - Base stat totals (Layer 1)
 * - Conversion stats like damageFromHealth (Layer 2)
 * - Chained calculations (Layers 3+)
 * - Config overrides for affix-specific values
 */

import {
  LAYERS,
  DERIVED_STATS,
  calculateDerivedStats,
  calculateDerivedStatsDetailed,
  getCalculationOrder,
  getStatsByLayer,
  getDependencyChain,
} from '../src/utils/derivedStats.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

const BASE_STATS_FIXTURE = {
  // Attributes
  strength: 100,
  strengthBonus: 20,
  dexterity: 80,
  dexterityBonus: 10,
  wisdom: 60,
  wisdomBonus: 15,
  vitality: 120,
  vitalityBonus: 25,
  endurance: 50,
  enduranceBonus: 0,
  agility: 70,
  agilityBonus: 5,
  luck: 40,
  luckBonus: 0,
  stamina: 90,
  staminaBonus: 10,

  // Defense
  armor: 500,
  armorBonus: 30,
  health: 1000,
  healthBonus: 50,

  // Offense
  damage: 200,
  damageBonus: 40,
};

// ============================================================================
// LAYER 1 TESTS: Total Stats (base + bonus%)
// ============================================================================

test('Layer 1: totalStrength = strength * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // 100 * (1 + 20/100) = 100 * 1.2 = 120
  assertEqual(result.totalStrength, 120, 'totalStrength');
});

test('Layer 1: totalVitality = vitality * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // 120 * (1 + 25/100) = 120 * 1.25 = 150
  assertEqual(result.totalVitality, 150, 'totalVitality');
});

test('Layer 1: totalHealth = health * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // 1000 * (1 + 50/100) = 1000 * 1.5 = 1500
  assertEqual(result.totalHealth, 1500, 'totalHealth');
});

test('Layer 1: totalDamage = damage * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // 200 * (1 + 40/100) = 200 * 1.4 = 280
  assertEqual(result.totalDamage, 280, 'totalDamage');
});

test('Layer 1: totalArmor = armor * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // 500 * (1 + 30/100) = 500 * 1.3 = 650
  assertEqual(result.totalArmor, 650, 'totalArmor');
});

// ============================================================================
// LAYER 2 TESTS: Primary Derived (conversions)
// ============================================================================

test('Layer 2: damageFromHealth = 1% of totalHealth', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // totalHealth = 1500, 1% = 15
  assertEqual(result.damageFromHealth, 15, 'damageFromHealth');
});

test('Layer 2: damageFromHealth with config override', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE, {
    damageFromHealth: { sourceStat: 'totalHealth', percentage: 5 },
  });
  // totalHealth = 1500, 5% = 75
  assertEqual(result.damageFromHealth, 75, 'damageFromHealth with 5%');
});

test('Layer 2: monogramValueFromStrength default config', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // totalStrength = 120, per 100 = 1
  assertEqual(result.monogramValueFromStrength, 1, 'monogramValueFromStrength');
});

test('Layer 2: monogramValueFromStrength with config override', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE, {
    monogramValueFromStrength: { sourceStat: 'totalStrength', ratio: 50, baseValue: 2 },
  });
  // totalStrength = 120, per 50 = 2, * baseValue 2 = 4
  assertEqual(result.monogramValueFromStrength, 4, 'monogramValueFromStrength with override');
});

test('Layer 2: potionSlotsFromAttributes', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // totalStrength=120 + totalVitality=150 = 270, per 200 = 1
  assertEqual(result.potionSlotsFromAttributes, 1, 'potionSlotsFromAttributes');
});

// ============================================================================
// LAYER 3 TESTS: Secondary Derived (chains and combinations)
// ============================================================================

test('Layer 3: finalDamage = totalDamage + damageFromHealth', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // totalDamage=280 + damageFromHealth=15 = 295
  assertEqual(result.finalDamage, 295, 'finalDamage');
});

test('Layer 3: chainedElementalBonus from monogramValue', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // monogramValueFromStrength=1, per 1 * 2% = 2
  assertEqual(result.chainedElementalBonus, 2, 'chainedElementalBonus');
});

test('Layer 3: statBonusFromPotions', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // potionSlotsFromAttributes=1, per 1 * 5 = 5
  assertEqual(result.statBonusFromPotions, 5, 'statBonusFromPotions');
});

// ============================================================================
// LAYER 4 TESTS: Tertiary Derived (deep chains)
// ============================================================================

test('Layer 4: chainedHealthBonus from elementalBonus', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  // chainedElementalBonus=2, per 5 * 10 = 0 (floor of 2/5 = 0)
  assertEqual(result.chainedHealthBonus, 0, 'chainedHealthBonus (elemental too low)');
});

test('Layer 4: chainedHealthBonus with higher elemental', () => {
  // Boost monogram to get higher elemental bonus
  const result = calculateDerivedStats(BASE_STATS_FIXTURE, {
    monogramValueFromStrength: { sourceStat: 'totalStrength', ratio: 10, baseValue: 1 },
  });
  // totalStrength=120/10=12 monogram value
  // 12 * 2% = 24 elemental bonus
  // 24/5 = 4 * 10 = 40 health bonus
  assertEqual(result.chainedHealthBonus, 40, 'chainedHealthBonus with boosted chain');
});

// ============================================================================
// CHAIN VALIDATION TESTS
// ============================================================================

test('Dependency chain: strength -> totalStrength -> monogram -> elemental -> health', () => {
  const chain = getDependencyChain('chainedHealthBonus');
  // Should include the full chain
  const expected = ['strength', 'strengthBonus', 'totalStrength', 'monogramValueFromStrength', 'chainedElementalBonus', 'chainedHealthBonus'];
  for (const stat of expected) {
    if (!chain.includes(stat)) {
      throw new Error(`Missing ${stat} in chain: ${chain.join(' -> ')}`);
    }
  }
});

test('Calculation order respects layers', () => {
  const order = getCalculationOrder();
  const orderIds = order.map(s => s.id);

  // Layer 1 stats should come before Layer 2
  const totalStrengthIdx = orderIds.indexOf('totalStrength');
  const monogramIdx = orderIds.indexOf('monogramValueFromStrength');
  if (totalStrengthIdx >= monogramIdx) {
    throw new Error('totalStrength should be calculated before monogramValueFromStrength');
  }

  // Layer 2 should come before Layer 3
  const damageFromHealthIdx = orderIds.indexOf('damageFromHealth');
  const finalDamageIdx = orderIds.indexOf('finalDamage');
  if (damageFromHealthIdx >= finalDamageIdx) {
    throw new Error('damageFromHealth should be calculated before finalDamage');
  }
});

test('Stats grouped by layer correctly', () => {
  const byLayer = getStatsByLayer();

  // Check layer 1 has totals
  const layer1Ids = (byLayer[LAYERS.TOTALS] || []).map(s => s.id);
  if (!layer1Ids.includes('totalStrength')) {
    throw new Error('Layer 1 should include totalStrength');
  }

  // Check layer 2 has conversions
  const layer2Ids = (byLayer[LAYERS.PRIMARY_DERIVED] || []).map(s => s.id);
  if (!layer2Ids.includes('damageFromHealth')) {
    throw new Error('Layer 2 should include damageFromHealth');
  }

  // Check layer 3 has combinations
  const layer3Ids = (byLayer[LAYERS.SECONDARY_DERIVED] || []).map(s => s.id);
  if (!layer3Ids.includes('finalDamage')) {
    throw new Error('Layer 3 should include finalDamage');
  }
});

// ============================================================================
// DETAILED OUTPUT TESTS
// ============================================================================

test('calculateDerivedStatsDetailed returns proper structure', () => {
  const result = calculateDerivedStatsDetailed(BASE_STATS_FIXTURE);

  if (!result.values || typeof result.values !== 'object') {
    throw new Error('Missing values object');
  }
  if (!Array.isArray(result.detailed)) {
    throw new Error('detailed should be an array');
  }
  if (!result.byCategory || typeof result.byCategory !== 'object') {
    throw new Error('Missing byCategory object');
  }
  if (!result.byLayer || typeof result.byLayer !== 'object') {
    throw new Error('Missing byLayer object');
  }
});

test('Detailed stats include formatted values', () => {
  const result = calculateDerivedStatsDetailed(BASE_STATS_FIXTURE);
  const totalStrength = result.detailed.find(s => s.id === 'totalStrength');

  if (!totalStrength) {
    throw new Error('Missing totalStrength in detailed');
  }
  if (totalStrength.formattedValue !== '120') {
    throw new Error(`Expected formatted '120', got '${totalStrength.formattedValue}'`);
  }
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

test('Handles zero base stats gracefully', () => {
  const result = calculateDerivedStats({
    strength: 0,
    strengthBonus: 100,
    health: 0,
    healthBonus: 0,
    damage: 0,
    damageBonus: 0,
  });

  assertEqual(result.totalStrength, 0, 'zero strength stays zero');
  assertEqual(result.totalHealth, 0, 'zero health stays zero');
  assertEqual(result.damageFromHealth, 0, 'zero health gives zero damage');
});

test('Handles missing stats gracefully', () => {
  const result = calculateDerivedStats({});

  assertEqual(result.totalStrength, 0, 'missing stats default to zero');
  assertEqual(result.totalHealth, 0, 'missing health defaults to zero');
  assertEqual(result.finalDamage, 0, 'final damage with no inputs is zero');
});

test('Handles negative bonuses', () => {
  const result = calculateDerivedStats({
    strength: 100,
    strengthBonus: -50, // 50% reduction
    health: 1000,
    healthBonus: -25,
  });

  // 100 * (1 + -50/100) = 100 * 0.5 = 50
  assertEqual(result.totalStrength, 50, 'negative bonus reduces total');
  // 1000 * (1 + -25/100) = 1000 * 0.75 = 750
  assertEqual(result.totalHealth, 750, 'negative health bonus');
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

console.log('\n=== Derived Stats Tests ===\n');

// Collect results for summary
const testResults = [];

// Run each test block
console.log('--- Layer 1: Total Stats ---');
testResults.push(test('Layer 1: totalStrength = strength * (1 + bonus%)', () => {
  const result = calculateDerivedStats(BASE_STATS_FIXTURE);
  assertEqual(result.totalStrength, 120, 'totalStrength');
}));

// ... (tests are defined above, this is just the runner)

console.log('\n--- Summary ---');
// This file can be run with: node --experimental-vm-modules test/derivedStats.test.js
