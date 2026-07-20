'use client';

import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import EditIcon from '@mui/icons-material/Edit';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { PageHeader, LoadingState, EmptyState, ErrorAlert } from '@/components/common/PageElements';
import { AccountantModule, UserRole, ALL_ACCOUNTANT_MODULES, accountantModuleLabels } from '@/types';
import { getCreatableRoles, getRoleLabel, canManageModuleAccess } from '@/lib/permissions';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  moduleAccess?: AccountantModule[];
  isActive: boolean;
  createdAt: string;
}

const roleColors: Record<UserRole, 'error' | 'warning' | 'info'> = {
  [UserRole.SUPER_ADMIN]: 'error',
  [UserRole.ADMIN]: 'warning',
  [UserRole.USER]: 'info',
};

export default function UsersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole;
  const creatableRoles = role ? getCreatableRoles(role) : [];
  const canManageModules = role ? canManageModuleAccess(role) : false;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [selectedModules, setSelectedModules] = useState<AccountantModule[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER,
    moduleAccess: [] as AccountantModule[],
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to load users');
      setUsers(await res.json());
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleModule = (mod: AccountantModule, current: AccountantModule[]) => {
    return current.includes(mod) ? current.filter((m) => m !== mod) : [...current, mod];
  };

  const handleCreate = async () => {
    const payload = {
      ...form,
      moduleAccess: form.role === UserRole.USER ? form.moduleAccess : undefined,
    };
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      setForm({ name: '', email: '', password: '', role: creatableRoles[0] || UserRole.USER, moduleAccess: [] });
      fetchUsers();
      setSnack({ open: true, message: 'User created successfully', severity: 'success' });
    } else {
      const err = await res.json();
      setSnack({ open: true, message: err.error || 'Failed to create user', severity: 'error' });
    }
  };

  const openModulesDialog = (user: UserRecord) => {
    setEditingUser(user);
    setSelectedModules(user.moduleAccess ?? []);
    setModulesDialogOpen(true);
  };

  const handleSaveModules = async () => {
    if (!editingUser) return;
    const res = await fetch(`/api/users/${editingUser._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleAccess: selectedModules }),
    });

    if (res.ok) {
      setModulesDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
      setSnack({ open: true, message: 'Module access updated', severity: 'success' });
    } else {
      const err = await res.json();
      setSnack({ open: true, message: err.error || 'Failed to update modules', severity: 'error' });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
      setSnack({ open: true, message: 'User deactivated', severity: 'success' });
    }
  };

  if (loading) return <LoadingState message="Loading users..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchUsers} />;

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage admin and accountant users in your organization"
        action={
          creatableRoles.length > 0 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Create User
            </Button>
          ) : undefined
        }
      />

      {users.length === 0 ? (
        <EmptyState title="No users found" description="Create users to manage your team" />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Module Access</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell><Typography sx={{ fontWeight: 500 }}>{user.name}</Typography></TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={getRoleLabel(user.role)} color={roleColors[user.role]} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.role === UserRole.USER ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(user.moduleAccess?.length ?? 0) > 0 ? (
                            user.moduleAccess!.map((mod) => (
                              <Chip key={mod} label={accountantModuleLabels[mod]} size="small" variant="outlined" />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">None assigned</Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">All modules</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'default'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      {canManageModules && user.role === UserRole.USER && user.isActive && (
                        <IconButton size="small" onClick={() => openModulesDialog(user)} title="Edit module access">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {user.isActive && user.role !== UserRole.SUPER_ADMIN && user._id !== session?.user?.id && (
                        <IconButton color="error" size="small" onClick={() => handleDeactivate(user._id)} title="Deactivate">
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required helperText="Minimum 8 characters" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  {creatableRoles.map((r) => (
                    <MenuItem key={r} value={r}>{getRoleLabel(r)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.role === UserRole.USER && (
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset" variant="standard">
                  <FormLabel component="legend">Module Access</FormLabel>
                  <FormGroup>
                    {ALL_ACCOUNTANT_MODULES.map((mod) => (
                      <FormControlLabel
                        key={mod}
                        control={
                          <Checkbox
                            checked={form.moduleAccess.includes(mod)}
                            onChange={() =>
                              setForm({ ...form, moduleAccess: toggleModule(mod, form.moduleAccess) })
                            }
                          />
                        }
                        label={accountantModuleLabels[mod]}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.email || form.password.length < 8}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={modulesDialogOpen} onClose={() => setModulesDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Module Access</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assign modules for {editingUser.name}
            </Typography>
          )}
          <FormGroup>
            {ALL_ACCOUNTANT_MODULES.map((mod) => (
              <FormControlLabel
                key={mod}
                control={
                  <Checkbox
                    checked={selectedModules.includes(mod)}
                    onChange={() => setSelectedModules(toggleModule(mod, selectedModules))}
                  />
                }
                label={accountantModuleLabels[mod]}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModulesDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveModules}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
