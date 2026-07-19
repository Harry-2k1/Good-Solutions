'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useState, useEffect, useCallback } from 'react';
import { TaskStatus } from '@/types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface Task {
  _id: string;
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status: TaskStatus;
  assignedTo?: { _id: string; name: string };
  createdBy?: { _id: string; name: string };
  createdAt: string;
}

interface UserOption {
  _id: string;
  name: string;
}

const statusColors: Record<TaskStatus, 'default' | 'primary' | 'success' | 'warning'> = {
  [TaskStatus.OPEN]: 'default',
  [TaskStatus.IN_PROGRESS]: 'primary',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.ON_HOLD]: 'warning',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.OPEN]: 'Open',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.ON_HOLD]: 'On Hold',
};

export default function TasksPanel({ companyId }: { companyId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    startTime: null as Dayjs | null,
    endTime: null as Dayjs | null,
    status: TaskStatus.OPEN,
    assignedTo: '',
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/companies/${companyId}/tasks`);
    if (res.ok) setTasks(await res.json());
  }, [companyId]);

  useEffect(() => {
    fetchTasks();
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .catch(() => {});
  }, [fetchTasks]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      startTime: null,
      endTime: null,
      status: TaskStatus.OPEN,
      assignedTo: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      name: task.name,
      description: task.description || '',
      startTime: task.startTime ? dayjs(task.startTime) : null,
      endTime: task.endTime ? dayjs(task.endTime) : null,
      status: task.status,
      assignedTo: task.assignedTo?._id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      startTime: form.startTime?.toISOString(),
      endTime: form.endTime?.toISOString(),
      status: form.status,
      assignedTo: form.assignedTo || undefined,
    };

    const url = `/api/companies/${companyId}/tasks`;
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { taskId: editing._id, ...payload } : payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchTasks();
      setSnack({ open: true, message: 'Task saved', severity: 'success' });
    } else {
      const err = await res.json();
      setSnack({ open: true, message: err.error || 'Failed', severity: 'error' });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/companies/${companyId}/tasks?taskId=${taskId}`, {
      method: 'DELETE',
    });
    if (res.ok) fetchTasks();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Tasks</Typography>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openCreate}>
            Add Task
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No tasks yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task._id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{task.name}</Typography>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {task.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[task.status]}
                        color={statusColors[task.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{task.assignedTo?.name || '—'}</TableCell>
                    <TableCell>
                      {task.startTime ? dayjs(task.startTime).format('DD MMM YYYY') : '—'}
                    </TableCell>
                    <TableCell>
                      {task.endTime ? dayjs(task.endTime).format('DD MMM YYYY') : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(task)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(task._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Task Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                >
                  {Object.values(TaskStatus).map((s) => (
                    <MenuItem key={s} value={s}>
                      {statusLabels[s]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={form.assignedTo}
                  label="Assigned To"
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateTimePicker
                label="Start Time"
                value={form.startTime}
                onChange={(v) => setForm({ ...form, startTime: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateTimePicker
                label="End Time"
                value={form.endTime}
                onChange={(v) => setForm({ ...form, endTime: v })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Card>
  );
}
