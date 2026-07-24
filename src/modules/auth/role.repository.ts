import prisma from "../../../framework/config/prisma.js";

export const roleRepository = {
  async findByName(name: string): Promise<{ id: number } | null> {
    return prisma.roles.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async getRolesByUserId(userId: number): Promise<string[]> {
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: { select: { name: true } } },
    });

    return userRoles.map((ur) => ur.roles.name);
  },

  async getPermissionsByUserId(userId: number): Promise<string[]> {
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: { permissions: true },
            },
          },
        },
      },
    });

    return userRoles.flatMap((ur) =>
      ur.roles.role_permissions.map((rp) => rp.permissions.name)
    );
  },
};
