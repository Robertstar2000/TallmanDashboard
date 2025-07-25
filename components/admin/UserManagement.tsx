'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Shield, ShieldCheck, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: number;
  username: string;
  email?: string;
  display_name?: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  created_date: string;
  last_login?: string;
  created_by?: string;
  notes?: string;
}

interface UserFormData {
  username: string;
  email: string;
  display_name: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  notes: string;
}

const initialFormData: UserFormData = {
  username: '',
  email: '',
  display_name: '',
  access_level: 'user',
  is_active: true,
  notes: '',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setFormData(initialFormData);
    setEditingUser(null);
    setShowAddDialog(true);
  };

  const handleEditUser = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email || '',
      display_name: user.display_name || '',
      access_level: user.access_level,
      is_active: user.is_active,
      notes: user.notes || '',
    });
    setEditingUser(user);
    setShowAddDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      setError(null);

      const url = editingUser ? '/api/admin/users' : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { id: editingUser.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        setShowAddDialog(false);
        setEditingUser(null);
        setFormData(initialFormData);
      } else {
        setError(data.error || 'Failed to save user');
      }
    } catch (err) {
      setError('Network error while saving user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchUsers();
        setDeleteConfirm(null);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error while deleting user');
    } finally {
      setSaving(false);
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'super_admin':
        return <ShieldCheck className="h-4 w-4 text-red-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-green-600" />;
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'super_admin':
        return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getAccessLevelDescription = (level: string) => {
    switch (level) {
      case 'super_admin':
        return 'Full system access, user management, database control';
      case 'admin':
        return 'Can correct answers, manage Q&A database';
      default:
        return 'Can ask questions and view answers';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <p className="text-gray-600 mt-1">
            Control user access and permissions for the dashboard
          </p>
        </div>
        <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Access Rights Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">User Access Rights:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">User</span>
            <span className="text-gray-600">Can ask questions and view answers</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Admin</span>
            <span className="text-gray-600">Can correct answers, manage Q&A database</span>
          </div>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-800">Super Admin</span>
            <span className="text-gray-600">Full system access, user management, database control</span>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.display_name || user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username} {user.email && `• ${user.email}`}
                        </div>
                        {user.last_login && (
                          <div className="text-xs text-gray-400">
                            Last login: {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {getAccessLevelIcon(user.access_level)}
                        {getAccessLevelBadge(user.access_level)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(user.created_date).toLocaleDateString()}
                      {user.created_by && (
                        <div className="text-xs">by {user.created_by}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(user)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Update user information and permissions'
                : 'Add a new user to the system'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={!!editingUser} // Can't change username when editing
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Enter display name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Access Level</label>
              <Select
                value={formData.access_level}
                onValueChange={(value: 'user' | 'admin' | 'super_admin') => 
                  setFormData({ ...formData, access_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {getAccessLevelDescription(formData.access_level)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => 
                  setFormData({ ...formData, is_active: value === 'active' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving || !formData.username.trim()}>
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingUser ? 'Update' : 'Add'} User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{deleteConfirm?.username}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
