export const cypressCheck = (): boolean => {
  return typeof window !== 'undefined' && 'Cypress' in window;
};