import {
  useActiveAuthProvider,
  useIsExistAuthentication,
  useLogout,
  useTranslate,
  useWarnAboutChange,
} from "@refinedev/core";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";

export const Logout = ({ collapsed }: { collapsed: boolean }) => {
  const translate = useTranslate();

  const isExistAuthentication = useIsExistAuthentication();
  const activeAuthProvider = useActiveAuthProvider();

  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { mutate: logout } = useLogout({
    v3LegacyAuthProviderCompatible: Boolean(activeAuthProvider?.isLegacy),
  });

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );

      if (confirm) {
        setWarnWhen(false);
        logout();
      }
    } else {
      logout();
    }
  };

  return (
    isExistAuthentication && (
      <Tooltip
        title={translate("buttons.logout", "Logout")}
        placement="right"
        disableHoverListener={!collapsed}
        arrow
      >
        <ListItemButton
          key="logout"
          onClick={() => handleLogout()}
          sx={{
            justifyContent: "center",
          }}
        >
          <ListItemIcon
            sx={{
              justifyContent: "center",
              minWidth: "24px",
              transition: "margin-right 0.3s",
              marginRight: collapsed ? "0px" : "12px",
              color: "currentColor",
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={translate("buttons.logout", "Logout")}
            slotProps={{
              primary: {
                noWrap: true,
                fontSize: "14px",
              },
            }}
          />
        </ListItemButton>
      </Tooltip>
    )
  );
};
