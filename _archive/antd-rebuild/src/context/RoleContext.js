import React, { createContext, useContext, useState } from "react";
import { ROLES } from "constants/DashboardConstant";

/*
 * Logged-in role. Prototype only: in the portal this comes from the session
 * (EncParty: department → Super Admin, lessee/party → Party).
 */
const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES.SUPER_ADMIN);
  return <RoleContext.Provider value={{ role, setRole, isParty: role === ROLES.PARTY }}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
