"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManualUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status: string;
  // transient field used only during editing
  password?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManualUserDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManualUser[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<ManualUser> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/manual-users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openEditor = (user?: ManualUser) => {
    setEditingUser(user ?? { email: '', name: '', role: 'user', status: 'active', password: '' });
    setEditorOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (!editingUser.email) {
      toast({ title: 'Validation', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!editingUser.id && !editingUser.password) {
      // Creating new user requires password
      toast({ title: 'Validation', description: 'Password is required for new user', variant: 'destructive' });
      return;
    }
    if (!editingUser) return;
    try {
      const method = editingUser.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/manual-users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          status: editingUser.status,
          password: editingUser.password,
          id: editingUser.id,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast({ title: 'Saved', description: `User ${editingUser.email} saved` });
      setEditorOpen(false);
      fetchUsers();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/manual-users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Deleted", description: `User ${email} removed` });
      setUsers(prev => prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()));
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manual User Management</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : error ? (
          <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditor(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(u.email)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-gray-500">No manual users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}

        <DialogFooter className="justify-between">
          <Button onClick={() => openEditor()}>Add User</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>

        {/* nested editor dialog */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>{editingUser?.id ? 'Edit User' : 'Add User'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input className="w-full border rounded px-2 py-1" value={editingUser?.email ?? ''} onChange={e => setEditingUser({ ...editingUser!, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input className="w-full border rounded px-2 py-1" value={editingUser?.name ?? ''} onChange={e => setEditingUser({ ...editingUser!, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Password {editingUser?.id ? '(optional)' : ''}</label>
                <input type="password" className="w-full border rounded px-2 py-1" value={editingUser?.password ?? ''} onChange={e => setEditingUser({ ...editingUser!, password: e.target.value })} />
              </div>
              <div className="flex space-x-2 mt-2">
                <div className="flex-1">
                  <label className="block text-sm mb-1">Role</label>
                  <select className="w-full border rounded px-2 py-1" value={editingUser?.role ?? 'user'} onChange={e => setEditingUser({ ...editingUser!, role: e.target.value as any })}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">Status</label>
                  <select className="w-full border rounded px-2 py-1" value={editingUser?.status ?? 'active'} onChange={e => setEditingUser({ ...editingUser!, status: e.target.value })}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUser}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
