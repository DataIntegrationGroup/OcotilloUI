import { useContext, useState } from "react";
import { useGetIdentity, useActiveAuthProvider } from "@refinedev/core";
import { HamburgerMenu } from "./hamburgerMenu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/mui";
import { ColorModeContext } from "../../contexts";
import {
  DarkModeRounded,
  LightModeOutlined,
  PersonOutline,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { ListItemIcon, Menu, MenuItem } from "@mui/material";

const stringAvatar = (name: string) => {
  // Reduce the string into a numerical hash value
  // Convert hash to a hexadecimal string
  // Ensure at least 6 characters for valid hex color
  const stringToColor = (name: string) =>
    `#${[...name]
      .reduce((hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0)
      .toString(16)
      .padStart(6, "0")
      .slice(-6)}`;

  name = name?.trim() || "UU";
  const nameParts = name?.trim().split(" "); // Split name into words
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}` // First letter of first two words
      : `${nameParts[0][0]}${nameParts[0][1] || nameParts[0][0]}`; // Handle single-word names

  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials.toUpperCase(),
  };
};

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = () => {
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  const { mode, setMode } = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    window.open(
      "https://fief.newmexicowaterdata.org/",
      "_blank",
      "noopener,noreferrer",
    );
    handleMenuClose();
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <HamburgerMenu />
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-end"
          alignItems="center"
        >
          <Stack
            direction="row"
            gap="16px"
            alignItems="center"
            justifyContent="center"
          >
            <IconButton
              onClick={() => {
                setMode();
              }}
            >
              {mode === "dark" ? (
                <LightModeOutlined sx={{ color: "#FFD700" }} />
              ) : (
                <DarkModeRounded sx={{ color: "#C0C0C0" }} />
              )}
            </IconButton>

            {user?.name && (
              <Typography variant="subtitle2" data-testid="header-user-name">
                {user?.name}
              </Typography>
            )}

            <IconButton onClick={handleMenuOpen}>
              {" "}
              {user?.avatar ? (
                <Avatar src={user?.avatar} alt={user?.name} />
              ) : (
                <Avatar {...stringAvatar(user?.name)} />
              )}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <PersonOutline fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
