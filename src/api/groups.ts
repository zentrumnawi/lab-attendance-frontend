import { httpJson } from "@/api/http";
import type { Group } from "@/stores/types";

export async function getGroups(): Promise<Group[]> {
  return await httpJson<Group[]>(`/api/groups/`);
}

export async function deleteGroup(id: string) {
  return await httpJson<void>(`/api/groups/${id}/`, {
    method: "DELETE",
  });
}

export async function patchGroup(id: string, data: Partial<Group>) {
  return await httpJson<void>(`/api/groups/${id}/`, {
    method: "PATCH",
    body: data,
  });
}

export async function postGroup(data: Omit<Group, "id">) {
  return await httpJson<Group>(`/api/groups/`, {
    method: "POST",
    body: data,
  });
}

export async function getUsers(): Promise<{ id: string; username: string }[]> {
  return await httpJson<{ id: string; username: string }[]>(`/api/users/`);
}
