"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminMessages } from "@/hooks/admin/useAdminMessages";
import { useAdminCreateMessage } from "@/hooks/admin/useAdminCreateMessage";
import { useAdminUpdateMessage } from "@/hooks/admin/useAdminUpdateMessage";
import { useAdminDeleteMessage } from "@/hooks/admin/useAdminDeleteMessage";
import { Button } from "@/components/ui/button";
import type { MessageDto, CreateMessageDto, UpdateMessageDto } from "@/sdk";

export function AdminDashboard() {
  const { data: messages, isLoading, error } = useAdminMessages();
  const createMutation = useAdminCreateMessage();
  const updateMutation = useAdminUpdateMessage();
  const deleteMutation = useAdminDeleteMessage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MessageDto | null>(null);
  const [createForm, setCreateForm] = useState<CreateMessageDto>({ title: "", note: "" });
  const [editForm, setEditForm] = useState<UpdateMessageDto>({ title: "", note: "" });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.note.trim()) {
      toast.error("Title and note are required");
      return;
    }
    try {
      await createMutation.mutateAsync(createForm);
      toast.success("Message created");
      setCreateOpen(false);
      setCreateForm({ title: "", note: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const openEdit = (msg: MessageDto) => {
    setEditing(msg);
    setEditForm({ title: msg.title, note: msg.note });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const dto: UpdateMessageDto = {
      title: editForm.title ?? editing.title,
      note: editForm.note ?? editing.note,
    };
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto });
      toast.success("Message updated");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-white/70 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-xl font-semibold text-white">Lore (Messages)</h1>
        <Button
          variant="spotify"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Message
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 mb-4">
          Failed to load messages. You may not have admin access.
        </div>
      )}

      {!isLoading && !error && messages && (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    No messages yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{msg.title}</td>
                    <td className="px-4 py-3 text-white/80 text-sm max-w-xs truncate" title={msg.note}>
                      {msg.note}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(msg)}
                          className="text-white/70 hover:text-white"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(msg.id)}
                          className="text-red-400/80 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Create New Message">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Title</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
                placeholder="Message title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Note</label>
              <textarea
                value={createForm.note}
                onChange={(e) => setCreateForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green min-h-[100px]"
                placeholder="Message note"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="spotify" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Edit Message">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Title</label>
              <input
                type="text"
                value={editForm.title ?? editing.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
                placeholder="Message title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Note</label>
              <textarea
                value={editForm.note ?? editing.note}
                onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green min-h-[100px]"
                placeholder="Message note"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="spotify" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-xl border border-white/10 bg-[rgb(25,20,20)] shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
            ×
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
