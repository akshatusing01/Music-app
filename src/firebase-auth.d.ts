declare module 'firebase/auth' {
  export interface User {
    email?: string | null;
    displayName?: string | null;
    uid?: string;
  }
}
