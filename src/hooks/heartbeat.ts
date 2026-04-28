// src/hooks/heartbeat.ts
export function heartbeatHandler(event: any) {
  console.log('💓 heartbeat triggered', event);
  return { proceed: true };
}