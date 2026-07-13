// Feature Flag Service
// Granular per-feature flags controlled by environment variables.
// Each flag independently gates a feature for progressive rollout.

const flags = {
  FEATURE_PROFILES_SUPABASE: () => process.env.FEATURE_PROFILES_SUPABASE === 'true',
  FEATURE_COMPLAINTS_SUPABASE: () => process.env.FEATURE_COMPLAINTS_SUPABASE === 'true',
  FEATURE_QUICKNOTES_SUPABASE: () => process.env.FEATURE_QUICKNOTES_SUPABASE === 'true',
  FEATURE_ATTACHMENTS_S3: () => process.env.FEATURE_ATTACHMENTS_S3 === 'true',
  FEATURE_REALTIME_WS: () => process.env.FEATURE_REALTIME_WS === 'true',
};

function isEnabled(flagName) {
  const fn = flags[flagName];
  return fn ? fn() : false;
}

function getAllFlags() {
  const result = {};
  for (const key of Object.keys(flags)) {
    result[key] = isEnabled(key);
  }
  return result;
}

module.exports = { isEnabled, getAllFlags };
