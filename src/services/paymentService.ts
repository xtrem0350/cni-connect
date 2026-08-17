export async function simulatePayment(amount: number, label: string) {
  return {
    ok: true,
    amount,
    label,
    provider: "mock",
    status: "pending",
  };
}
