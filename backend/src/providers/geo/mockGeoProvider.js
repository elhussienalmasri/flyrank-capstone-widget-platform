// Deterministic provider for automated tests — never hits the
// network. Two named modes so tests can exercise both the success
// path and the "everyone is down" path predictably.
export const name = 'mock';

export function up() {
  return {
    name: 'mock-up',
    async lookup() {
      return { country: 'Testland', city: 'Testville' };
    },
  };
}

export function down() {
  return {
    name: 'mock-down',
    async lookup() {
      throw new Error('mock provider is intentionally down');
    },
  };
}
