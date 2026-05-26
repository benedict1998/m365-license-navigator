export const STATUS_LABELS = {
  included: 'Included',
  partially_included: 'Partially included',
  add_on_required: 'Add-on required',
  higher_license_required: 'Higher license required',
  not_included: 'Not included',
  requires_configuration: 'Requires configuration',
  renamed_or_deprecated: 'Renamed/deprecated',
  source_review_required: 'Source review required'
};

export function getBranches(features) {
  return [...new Set(features.map((feature) => feature.branch))].sort();
}

export function getFeaturesForBranch(features, branch) {
  if (!branch || branch === 'All') return features;
  return features.filter((feature) => feature.branch === branch);
}

export function getCoverageForFeature(license, feature) {
  const included = new Set(license?.includedServicePlans ?? []);
  const required = feature.requiredServicePlans ?? [];
  const covered = required.filter((planId) => included.has(planId));
  const missing = required.filter((planId) => !included.has(planId));
  let status = 'not_included';
  if (required.length === 0) status = 'source_review_required';
  else if (missing.length === 0) status = feature.confidence === 'source_review_required' ? 'source_review_required' : 'included';
  else if (covered.length > 0) status = 'partially_included';
  else if ((feature.upgradeOptions ?? []).some((option) => option.includes('premium') || option === 'copilot-m365')) status = 'add_on_required';
  else if ((feature.upgradeOptions ?? []).length > 0) status = 'higher_license_required';
  if (feature.notes?.toLowerCase().includes('configured') && status === 'included') status = 'requires_configuration';
  return { status, coveredServicePlans: covered, missingServicePlans: missing, requiredServicePlans: required, upgradeOptions: feature.upgradeOptions ?? [], notes: feature.notes ?? '' };
}

export function buildPrerequisiteChain(license, feature, servicePlans) {
  const planName = (planId) => servicePlans.find((plan) => plan.id === planId)?.name ?? planId;
  const coverage = getCoverageForFeature(license, feature);
  return [
    { label: license?.name ?? 'No license selected', state: 'selected' },
    ...coverage.requiredServicePlans.map((planId) => ({ label: planName(planId), state: coverage.missingServicePlans.includes(planId) ? 'missing' : 'covered' })),
    { label: feature.name, state: coverage.missingServicePlans.length === 0 ? 'available' : 'blocked' }
  ];
}

export function compareLicenses(licenseA, licenseB, features) {
  if (!licenseA || !licenseB) return [];
  return features.map((feature) => ({ feature, a: getCoverageForFeature(licenseA, feature), b: getCoverageForFeature(licenseB, feature) }));
}

export function resolveSources(sourceIds, sources) {
  return (sourceIds ?? []).map((sourceId) => sources.find((source) => source.id === sourceId)).filter(Boolean);
}

export function getServicePlanNames(planIds, servicePlans) {
  return (planIds ?? []).map((planId) => servicePlans.find((plan) => plan.id === planId)?.name ?? planId);
}
