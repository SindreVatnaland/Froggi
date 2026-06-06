
export interface Froggi {
  betaOptIn: boolean | undefined;
  version: string | undefined;
  closeAction: 'minimize' | 'quit' | undefined;
  /** undefined = not yet asked, true/false = user's crash-report consent */
  crashReportsEnabled: boolean | undefined;
}