// src/hooks/heartbeat.ts
export async function heartbeatHandler(event: any) {
  console.log('💓 heartbeat triggered - periodic checkpoint');
  return { proceed: true };
}