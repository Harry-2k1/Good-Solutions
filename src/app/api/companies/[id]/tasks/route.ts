import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { taskSchema } from '@/lib/validation';
import { TaskStatus } from '@/types';
import { findSubdocumentById, removeSubdocumentById, toObjectId } from '@/lib/mongoose-utils';

async function getCompany(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const populated = await company.populate([
      { path: 'tasks.assignedTo', select: 'name email' },
      { path: 'tasks.createdBy', select: 'name email' },
    ]);

    return apiSuccess(populated.tasks);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    company.tasks.push({
      name: parsed.data.name,
      description: parsed.data.description,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
      status: parsed.data.status as TaskStatus,
      assignedTo: parsed.data.assignedTo ? toObjectId(parsed.data.assignedTo) : undefined,
      createdBy: toObjectId(sessionUser.id),
      createdAt: new Date(),
    });

    await company.save();
    return apiSuccess(company.tasks[company.tasks.length - 1], 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { taskId, ...updates } = body;

    if (!taskId) return apiError('Task ID is required', 400);

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const task = findSubdocumentById(company.tasks, taskId);
    if (!task) return apiError('Task not found', 404);

    const taskData = task as Record<string, unknown>;
    if (updates.name) taskData.name = updates.name;
    if (updates.description !== undefined) taskData.description = updates.description;
    if (updates.startTime) taskData.startTime = new Date(updates.startTime);
    if (updates.endTime) taskData.endTime = new Date(updates.endTime);
    if (updates.status) taskData.status = updates.status;
    if (updates.assignedTo !== undefined) {
      taskData.assignedTo = updates.assignedTo ? toObjectId(updates.assignedTo) : undefined;
    }

    await company.save();
    return apiSuccess(task);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) return apiError('Task ID is required', 400);

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const task = findSubdocumentById(company.tasks, taskId);
    if (!task) return apiError('Task not found', 404);

    company.tasks = removeSubdocumentById(company.tasks, taskId);
    await company.save();

    return apiSuccess({ message: 'Task deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
