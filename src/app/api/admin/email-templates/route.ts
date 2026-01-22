import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import {
  getAllActiveTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/lib/email-template-service';

/**
 * GET /api/admin/email-templates
 * List all email templates
 * Super admin only
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let templates = await getAllActiveTemplates();

    // Filter by category
    if (category && category !== 'all') {
      templates = templates.filter((t) => t.category === category);
    }

    // Search by name or key
    if (search) {
      const searchLower = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.key.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    return apiResponse({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return apiError('Failed to fetch email templates', 500);
  }
}

/**
 * POST /api/admin/email-templates
 * Create new email template
 * Super admin only
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  // Super admin only for creating templates
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required to create templates', 403);
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.key || !body.name || !body.subject || !body.htmlBody) {
      return apiError('Missing required fields: key, name, subject, htmlBody', 400);
    }

    // Validate key format (alphanumeric, underscores, hyphens only)
    if (!/^[a-z0-9_-]+$/.test(body.key)) {
      return apiError(
        'Template key must contain only lowercase letters, numbers, underscores, and hyphens',
        400
      );
    }

    const template = await createTemplate(
      {
        key: body.key,
        name: body.name,
        description: body.description,
        category: body.category || 'system',
        subject: body.subject,
        htmlBody: body.htmlBody,
        textBody: body.textBody,
        previewText: body.previewText,
        brandColor: body.brandColor,
        headerGradientStart: body.headerGradientStart,
        headerGradientEnd: body.headerGradientEnd,
        buttonColor: body.buttonColor,
        requiredVariables: body.requiredVariables || [],
      },
      authResult.user.id
    );

    return apiResponse(
      {
        template,
        message: 'Template created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating email template:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return apiError(error.message, 409);
      }
      return apiError(error.message, 400);
    }
    
    return apiError('Failed to create email template', 500);
  }
}
