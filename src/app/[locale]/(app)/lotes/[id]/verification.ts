export function verificationCodeShort(sha: string): string {
  return sha.slice(0, 8).toUpperCase();
}
