// Build production from main. Keep the migration branch available for previews.
const { VERCEL, VERCEL_ENV, VERCEL_GIT_COMMIT_REF } = process.env;
if (VERCEL === '1' && !VERCEL_ENV) {
  throw new Error('Vercel cloud builds must declare preview or production environment.');
}
if (VERCEL_GIT_COMMIT_REF && VERCEL_GIT_COMMIT_REF !== 'main'
    && (VERCEL_ENV === 'production' || VERCEL_GIT_COMMIT_REF !== 'codex/react-migration-drilldown')) {
  throw new Error('Deploy the React release from main. The migration branch is available for previews.');
}
console.log(`React ${VERCEL_ENV === 'production' ? 'production' : 'preview'} target accepted.`);
