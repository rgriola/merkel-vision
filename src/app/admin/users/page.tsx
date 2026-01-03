'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function AdminUsersPage() {
    return (
        <AdminRoute>
            <div className="container max-w-7xl mx-auto py-8 px-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all users in the system
                    </p>
                </div>

                <UserManagementTable />
            </div>
        </AdminRoute>
    );
}
