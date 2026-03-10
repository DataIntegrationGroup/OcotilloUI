import {
  CanAccess,
  ResourceContext,
  useRefineContext,
  useTranslate,
} from "@refinedev/core";
import { useContext } from "react";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useThemedLayoutContext } from "@refinedev/mui";
import { Dashboard as DashboardIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router";

export const Dashboard = ({
  collapsed,
  selectedKey,
}: {
  collapsed: boolean;
  selectedKey: string;
}) => {
  const { setMobileSiderOpen } = useThemedLayoutContext();
  const { options } = useRefineContext();
  const { resources } = useContext(ResourceContext);
  const translate = useTranslate();
  const hasDashboard = resources.some((resource) => resource.name === "dashboard");

  return hasDashboard ? (
    <CanAccess resource="dashboard" action="list">
      <Tooltip
        title={translate("dashboard.title", "Dashboard")}
        placement="right"
        disableHoverListener={!collapsed}
        arrow
      >
        <ListItemButton
          component={RouterLink}
          to="/home"
          selected={selectedKey === "/home"}
          onClick={() => {
            setMobileSiderOpen(false);
          }}
          sx={{
            pl: 2,
            py: 1,
            justifyContent: "center",
            color: selectedKey === "/home" ? "primary.main" : "text.primary",
          }}
        >
          <ListItemIcon
            sx={{
              justifyContent: "center",
              minWidth: "24px",
              transition: "margin-right 0.3s",
              marginRight: collapsed ? "0px" : "12px",
              color: "currentColor",
              fontSize: "14px",
            }}
          >
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText
            primary={translate("dashboard.title", "Dashboard")}
            slotProps={{
              primary: {
                noWrap: true,
                fontSize: "14px",
              },
            }}
          />
        </ListItemButton>
      </Tooltip>
    </CanAccess>
  ) : null;
};
