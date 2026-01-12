import { prisma } from "@/lib/db";
import {
  deleteUserAction,
  deleteWorkspaceAction,
  updateUserWorkspaceAction,
} from "./actions";
import WorkspaceForm from "./WorkspaceForm";
import UserForm from "./UserForm";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage() {
  const workspaces = await prisma.workspace.findMany({
    select: { id: true, name: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create or remove households. Deleting a workspace unassigns its
            users.
          </p>
        </div>
        <WorkspaceForm />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No workspaces yet.
                  </td>
                </tr>
              ) : (
                workspaces.map((workspace) => (
                  <tr key={workspace.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {workspace.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {workspace.slug}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(workspace.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteWorkspaceAction}>
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspace.id}
                        />
                        <button className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Users</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create users and assign them to a workspace.
          </p>
        </div>
        <UserForm workspaces={workspaces.map(({ id, name, slug }) => ({ id, name, slug }))} />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-900">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{user.email}</span>
                        {user.isAdmin ? (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Admin
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.workspace
                        ? `${user.workspace.name} (${user.workspace.slug})`
                        : "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {user.workspace ? (
                          <a
                            href={`/g/${user.workspace.slug}/cook`}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            View workspace
                          </a>
                        ) : null}
                        <form
                          action={updateUserWorkspaceAction}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <select
                            name="workspaceId"
                            defaultValue={user.workspace?.id ?? ""}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          >
                            <option value="">Unassigned</option>
                            {workspaces.map((workspace) => (
                              <option key={workspace.id} value={workspace.id}>
                                {workspace.name}
                              </option>
                            ))}
                          </select>
                          <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                            Save
                          </button>
                        </form>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            disabled={user.isAdmin}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              user.isAdmin
                                ? "cursor-not-allowed border-slate-200 text-slate-400"
                                : "border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700"
                            }`}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
