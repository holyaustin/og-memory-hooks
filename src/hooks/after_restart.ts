// src/hooks/after_restart.ts
export function afterRestartHandler(event: any) {
  console.log('✅ after_restart hook triggered', event);
  return { proceed: true };
}