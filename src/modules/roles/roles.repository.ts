import prisma from "../../../framework/config/prisma.js";

type PermissionResponse = {
  id: number;
  name: string;
};

export const roleRepository = {
  async findAll(): Promise<{ id: number; name: string }[]> {
    return prisma.roles.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
  },

  async findById(id: number): Promise<{ id: number; name: string } | null> {
    return prisma.roles.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async findByName(name: string): Promise<{ id: number } | null> {
    return prisma.roles.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string): Promise<{ id: number; name: string }> {
    return prisma.roles.create({
      data: { name },
      select: { id: true, name: true },
    });
  },

  async update(id: number, name: string): Promise<{ id: number; name: string }> {
    return prisma.roles.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
  },

  async countUsersByRoleId(id: number): Promise<number> {
    return prisma.user_roles.count({ where: { role_id: id } });
  },

  async delete(id: number): Promise<void> {
    await prisma.roles.delete({ where: { id } });
  },

  async findAllPermissions(): Promise<PermissionResponse[]> {
    return prisma.permissions.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
  },

  async findPermissionById(id: number): Promise<PermissionResponse | null> {
    return prisma.permissions.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async findPermissionByName(name: string): Promise<{ id: number } | null> {
    return prisma.permissions.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async createPermission(name: string): Promise<PermissionResponse> {
    return prisma.permissions.create({
      data: { name },
      select: { id: true, name: true },
    });
  },

  async updatePermission(id: number, name: string): Promise<PermissionResponse> {
    return prisma.permissions.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
  },

  async countRolesByPermissionId(id: number): Promise<number> {
    return prisma.role_permissions.count({ where: { permission_id: id } });
  },

  async deletePermission(id: number): Promise<void> {
    await prisma.permissions.delete({ where: { id } });
  },

  async getPermissionsByRoleId(roleId: number): Promise<PermissionResponse[]> {
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { role_id: roleId },
      include: { permissions: { select: { id: true, name: true } } },
    });

    return rolePermissions.map((rp) => rp.permissions);
  },

  async addPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await prisma.role_permissions.create({
      data: { role_id: roleId, permission_id: permissionId },
    });
  },

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await prisma.role_permissions.delete({
      where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } },
    });
  },

  async isPermissionAssignedToRole(roleId: number, permissionId: number): Promise<boolean> {
    const rp = await prisma.role_permissions.findUnique({
      where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } },
    });
    return rp !== null;
  },

  async findUserById(id: number): Promise<{ id: number } | null> {
    return prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  async findUsersByRoleId(roleId: number): Promise<{ id: number; email: string; first_name: string | null; last_name: string | null }[]> {
    const userRoles = await prisma.user_roles.findMany({
      where: { role_id: roleId },
      include: {
        users: {
          include: {
            profiles: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    return userRoles.map((ur) => ({
      id: ur.users.id,
      email: ur.users.email,
      first_name: ur.users.profiles?.first_name ?? null,
      last_name: ur.users.profiles?.last_name ?? null,
    }));
  },

  async findRolesByPermissionId(permissionId: number): Promise<{ id: number; name: string }[]> {
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { permission_id: permissionId },
      include: { roles: { select: { id: true, name: true } } },
    });

    return rolePermissions.map((rp) => rp.roles);
  },

  async findUserRoles(userId: number): Promise<{ id: number; name: string }[]> {
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: { select: { id: true, name: true } } },
    });

    return userRoles.map((ur) => ur.roles);
  },

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await prisma.user_roles.create({
      data: { user_id: userId, role_id: roleId },
    });
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await prisma.user_roles.delete({
      where: { user_id_role_id: { user_id: userId, role_id: roleId } },
    });
  },

  async isUserAssignedToRole(userId: number, roleId: number): Promise<boolean> {
    const ur = await prisma.user_roles.findUnique({
      where: { user_id_role_id: { user_id: userId, role_id: roleId } },
    });
    return ur !== null;
  },
};
