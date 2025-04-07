import {
  CanAccess,
  useLink,
  useRefineContext,
  useRouterContext,
  useRouterType,
  useTranslate,
} from "@refinedev/core";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useThemedLayoutContext } from "@refinedev/mui";
import { Dashboard as DashboardIcon } from "@mui/icons-material";

export const Dashboard = ({
  collapsed,
  selectedKey,
}: {
  collapsed: boolean;
  selectedKey: string;
}) => {
  const { setMobileSiderOpen } = useThemedLayoutContext();
  const { hasDashboard } = useRefineContext();
  const translate = useTranslate();

  const { Link: LegacyLink } = useRouterContext();
  const routerType = useRouterType();

  const NewLink = useLink();
  const Link = routerType === "legacy" ? LegacyLink : NewLink;

  return hasDashboard ? (
    <CanAccess resource="dashboard" action="list">
      <Tooltip
        title={translate("dashboard.title", "Dashboard")}
        placement="right"
        disableHoverListener={!collapsed}
        arrow
      >
        <ListItemButton
          component={Link}
          to="/"
          selected={selectedKey === "/"}
          onClick={() => {
            setMobileSiderOpen(false);
          }}
          sx={{
            pl: 2,
            py: 1,
            justifyContent: "center",
            color: selectedKey === "/" ? "primary.main" : "text.primary",
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
