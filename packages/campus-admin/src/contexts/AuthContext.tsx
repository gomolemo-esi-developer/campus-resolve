/**
 * Re-export shared AuthContext from @shared package
 * Campus Admin uses the same authentication as other platforms
 * This ensures consistent authentication across all three apps
 */

export {
  AuthProvider,
  useAuth,
  type User,
  type AuthContextType,
  type AuthProviderProps,
} from "@shared/contexts/AuthContext";
