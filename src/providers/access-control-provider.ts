import { getAccessToken } from "./fief-provider";
import { jwtDecode } from "jwt-decode";

export const accessControlProvider = {
  can: async ({ resource, action: _action, params: _params }) => {
    const token = jwtDecode(await getAccessToken());
    const permissions = token["permissions"] ?? [];

    if (resource === "water.wellinventoryform") {
      if (permissions.includes("datamanager:wellinventory:write")) {
        return { can: true };
      } else {
        return {
          can: false,
          reason:
            "You do not have permission to edit this resource. Please contact your administrator.",
        };
      }
    }
    return { can: true };
  },
};
