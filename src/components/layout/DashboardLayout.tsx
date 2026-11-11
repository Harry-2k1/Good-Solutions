"use client";

import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  alpha,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@/types";
import { canViewUsers, getRoleLabel } from "@/lib/permissions";
import BrandLogo from "@/components/common/BrandLogo";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import ChangePasswordDialog from "@/components/account/ChangePasswordDialog";

const DRAWER_WIDTH = 268;

const navItems = [
  { label: "Companies", href: "/", icon: <BusinessIcon /> },
  { label: "Users", href: "/users", icon: <PeopleIcon />, adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSnack, setPasswordSnack] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = session?.user?.role as UserRole | undefined;
  const showUsers = role && canViewUsers(role);
  const userInitial =
    mounted && sessionStatus === "authenticated" && session?.user?.name
      ? session.user.name.charAt(0).toUpperCase()
      : "";

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: (t) =>
            t.palette.mode === "light"
              ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, transparent 100%)`
              : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)} 0%, transparent 100%)`,
        }}
      >
        <BrandLogo variant="compact" />
      </Box>
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems
          .filter((item) => !item.adminOnly || (mounted && showUsers))
          .map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.75,
                  py: 1.25,
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    boxShadow: (t) =>
                      `0 4px 14px ${alpha(t.palette.primary.main, 0.4)}`,
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                />
              </ListItemButton>
            );
          })}
      </List>
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center" }}
        >
          Good Solutions
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: (t) => alpha(t.palette.background.paper, 0.85),
        }}
      >
        <Toolbar sx={{ gap: 0.5, px: { xs: 1, sm: 2 }, minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 0.5, display: { xs: "inline-flex", md: "none" } }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <ThemeSwitcher />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 1 }}>
            <Box
              sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mounted && sessionStatus === "authenticated" ? session?.user?.name : "\u00A0"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mounted && role ? getRoleLabel(role) : "\u00A0"}
              </Typography>
            </Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: { xs: 34, sm: 38 },
                  height: { xs: 34, sm: 38 },
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  boxShadow: (t) =>
                    `0 2px 8px ${alpha(t.palette.primary.main, 0.4)}`,
                }}
              >
                {userInitial}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
              {session?.user?.email}
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setPasswordDialogOpen(true);
              }}
            >
              <LockIcon sx={{ mr: 1 }} fontSize="small" />
              Change Password
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                signOut({ callbackUrl: "/login" });
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Sign Out
            </MenuItem>
          </Menu>
          <ChangePasswordDialog
            open={passwordDialogOpen}
            onClose={() => setPasswordDialogOpen(false)}
            onSuccess={() => setPasswordSnack(true)}
          />
          <Snackbar
            open={passwordSnack}
            autoHideDuration={4000}
            onClose={() => setPasswordSnack(false)}
          >
            <Alert severity="success">Password updated successfully</Alert>
          </Snackbar>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 1.5, sm: 3 },
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: "56px", sm: "64px" },
          minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
