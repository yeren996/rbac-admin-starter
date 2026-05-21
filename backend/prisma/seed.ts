import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import 'dotenv/config';

const prisma = new PrismaClient();

type MenuSeed = {
  children?: MenuSeed[];
  component?: string;
  hidden?: boolean;
  icon?: string;
  keepAlive?: boolean;
  name?: string;
  path?: string;
  permission?: string;
  redirect?: string;
  sort?: number;
  title: string;
  type: 'BUTTON' | 'DIRECTORY' | 'MENU';
};

const menus: MenuSeed[] = [
  {
    title: 'Dashboard',
    type: 'MENU',
    name: 'Dashboard',
    path: '/dashboard',
    component: '/dashboard/overview/index',
    icon: 'lucide:layout-dashboard',
    permission: 'dashboard:overview',
    sort: 1,
    keepAlive: true,
  },
  {
    title: '通知列表',
    type: 'MENU',
    name: 'NotificationList',
    path: '/notifications',
    component: '/notification/list/index',
    icon: 'carbon:notification',
    permission: 'notification:list',
    sort: 2,
    keepAlive: true,
  },
  {
    title: '系统管理',
    type: 'DIRECTORY',
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    icon: 'carbon:settings',
    sort: 100,
    children: [
      {
        title: '用户管理',
        type: 'MENU',
        name: 'SystemUser',
        path: '/system/user',
        component: '/system/user/index',
        icon: 'carbon:user-role',
        permission: 'system:user:list',
        sort: 1,
        children: [
          {
            title: '新增用户',
            type: 'BUTTON',
            permission: 'system:user:create',
            sort: 1,
          },
          {
            title: '编辑用户',
            type: 'BUTTON',
            permission: 'system:user:update',
            sort: 2,
          },
          {
            title: '删除用户',
            type: 'BUTTON',
            permission: 'system:user:delete',
            sort: 3,
          },
          {
            title: '重置密码',
            type: 'BUTTON',
            permission: 'system:user:reset-password',
            sort: 4,
          },
          {
            title: '分配角色',
            type: 'BUTTON',
            permission: 'system:user:assign-role',
            sort: 5,
          },
        ],
      },
      {
        title: '角色管理',
        type: 'MENU',
        name: 'SystemRole',
        path: '/system/role',
        component: '/system/role/index',
        icon: 'carbon:user-multiple',
        permission: 'system:role:list',
        sort: 2,
        children: [
          {
            title: '新增角色',
            type: 'BUTTON',
            permission: 'system:role:create',
            sort: 1,
          },
          {
            title: '编辑角色',
            type: 'BUTTON',
            permission: 'system:role:update',
            sort: 2,
          },
          {
            title: '删除角色',
            type: 'BUTTON',
            permission: 'system:role:delete',
            sort: 3,
          },
          {
            title: '分配菜单',
            type: 'BUTTON',
            permission: 'system:role:assign-menu',
            sort: 4,
          },
        ],
      },
      {
        title: '菜单管理',
        type: 'MENU',
        name: 'SystemMenu',
        path: '/system/menu',
        component: '/system/menu/index',
        icon: 'carbon:menu',
        permission: 'system:menu:list',
        sort: 3,
        children: [
          {
            title: '新增菜单',
            type: 'BUTTON',
            permission: 'system:menu:create',
            sort: 1,
          },
          {
            title: '编辑菜单',
            type: 'BUTTON',
            permission: 'system:menu:update',
            sort: 2,
          },
          {
            title: '删除菜单',
            type: 'BUTTON',
            permission: 'system:menu:delete',
            sort: 3,
          },
        ],
      },
      {
        title: '部门管理',
        type: 'MENU',
        name: 'SystemDepartment',
        path: '/system/department',
        component: '/system/department/index',
        icon: 'carbon:tree-view-alt',
        permission: 'system:department:list',
        sort: 4,
        children: [
          {
            title: '新增部门',
            type: 'BUTTON',
            permission: 'system:department:create',
            sort: 1,
          },
          {
            title: '编辑部门',
            type: 'BUTTON',
            permission: 'system:department:update',
            sort: 2,
          },
          {
            title: '删除部门',
            type: 'BUTTON',
            permission: 'system:department:delete',
            sort: 3,
          },
        ],
      },
      {
        title: '通知管理',
        type: 'MENU',
        name: 'SystemNotification',
        path: '/system/notification',
        component: '/system/notification/index',
        icon: 'carbon:notification',
        permission: 'system:notification:list',
        sort: 5,
        children: [
          {
            title: '标记通知',
            type: 'BUTTON',
            permission: 'system:notification:update',
            sort: 1,
          },
          {
            title: '删除通知',
            type: 'BUTTON',
            permission: 'system:notification:delete',
            sort: 2,
          },
          {
            title: '清空通知',
            type: 'BUTTON',
            permission: 'system:notification:delete',
            sort: 3,
          },
        ],
      },
    ],
  },
  {
    title: '系统审计',
    type: 'DIRECTORY',
    name: 'SystemAudit',
    path: '/system-audit',
    redirect: '/system/audit-log',
    icon: 'carbon:activity',
    sort: 200,
    children: [
      {
        title: '操作日志',
        type: 'MENU',
        name: 'SystemAuditLog',
        path: '/system/audit-log',
        component: '/system/audit-log/index',
        icon: 'carbon:document-audit',
        permission: 'system:audit:list',
        sort: 1,
      },
    ],
  },
  {
    title: '个人中心',
    type: 'MENU',
    name: 'Profile',
    path: '/profile',
    component: '/_core/profile/index',
    icon: 'carbon:user-profile',
    permission: 'profile:view',
    sort: 900,
    hidden: false,
  },
];

async function createMenuTree(
  tenantId: string,
  items: MenuSeed[],
  parentId?: string,
) {
  const created: string[] = [];
  for (const item of items) {
    const menu = await prisma.menu.create({
      data: {
        component: item.component,
        hidden: item.hidden ?? false,
        icon: item.icon,
        keepAlive: item.keepAlive ?? false,
        name: item.name,
        parentId,
        path: item.path,
        permission: item.permission,
        redirect: item.redirect,
        sort: item.sort ?? 0,
        tenantId,
        title: item.title,
        type: item.type,
      },
    });
    created.push(menu.id);
    if (item.children?.length) {
      created.push(...(await createMenuTree(tenantId, item.children, menu.id)));
    }
  }
  return created;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    create: { code: 'default', name: '默认租户', status: 'ENABLED' },
    update: { name: '默认租户', status: 'ENABLED' },
    where: { code: 'default' },
  });

  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.userRole.deleteMany({ where: { user: { tenantId: tenant.id } } }),
    prisma.roleMenu.deleteMany({ where: { role: { tenantId: tenant.id } } }),
    prisma.user.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.role.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.menu.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.department.deleteMany({ where: { tenantId: tenant.id } }),
  ]);

  const company = await prisma.department.create({
    data: { code: 'company', name: '总公司', sort: 1, tenantId: tenant.id },
  });
  const rd = await prisma.department.create({
    data: {
      code: 'rd',
      name: '研发部',
      parentId: company.id,
      sort: 1,
      tenantId: tenant.id,
    },
  });
  await prisma.department.createMany({
    data: [
      {
        code: 'product',
        name: '产品部',
        parentId: company.id,
        sort: 2,
        tenantId: tenant.id,
      },
      {
        code: 'ops',
        name: '运营部',
        parentId: company.id,
        sort: 3,
        tenantId: tenant.id,
      },
    ],
  });

  const allMenuIds = await createMenuTree(tenant.id, menus);
  /**
   * 普通用户默认只进入个人工作台、通知列表与个人中心。
   * “通知管理”保留给管理员，普通用户只使用面向个人的通知列表。
   */
  const basicUserMenuIds = (
    await prisma.menu.findMany({
      select: { id: true },
      where: {
        tenantId: tenant.id,
        OR: [
          { permission: 'dashboard:overview' },
          { permission: 'notification:list' },
          { permission: 'profile:view' },
        ],
      },
    })
  ).map((menu) => menu.id);
  const adminMenuIds = (
    await prisma.menu.findMany({
      select: { id: true },
      where: { tenantId: tenant.id },
    })
  ).map((menu) => menu.id);

  const superAdmin = await prisma.role.create({
    data: {
      code: 'super_admin',
      isSystem: true,
      name: '超级管理员',
      sort: 1,
      tenantId: tenant.id,
    },
  });
  const adminRole = await prisma.role.create({
    data: {
      code: 'admin',
      isSystem: true,
      name: '管理员',
      sort: 2,
      tenantId: tenant.id,
    },
  });
  const userRole = await prisma.role.create({
    data: {
      code: 'user',
      isSystem: true,
      name: '普通用户',
      sort: 3,
      tenantId: tenant.id,
    },
  });

  await prisma.roleMenu.createMany({
    data: allMenuIds.map((menuId) => ({ menuId, roleId: superAdmin.id })),
  });
  await prisma.roleMenu.createMany({
    data: adminMenuIds.map((menuId) => ({ menuId, roleId: adminRole.id })),
  });
  await prisma.roleMenu.createMany({
    data: basicUserMenuIds.map((menuId) => ({
      menuId,
      roleId: userRole.id,
    })),
  });

  const [adminUser, demoUser] = await Promise.all([
    prisma.user.create({
      data: {
        deptId: rd.id,
        isSuperAdmin: true,
        nickname: '超级管理员',
        passwordHash: await bcrypt.hash('Admin@123456', 10),
        tenantId: tenant.id,
        username: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        deptId: rd.id,
        isSuperAdmin: false,
        nickname: '演示用户',
        passwordHash: await bcrypt.hash('Demo@123456', 10),
        tenantId: tenant.id,
        username: 'demo',
      },
    }),
  ]);

  await prisma.userRole.createMany({
    data: [
      { roleId: superAdmin.id, userId: adminUser.id },
      { roleId: userRole.id, userId: demoUser.id },
    ],
  });

  console.warn(
    'Seed completed. Default users: admin/Admin@123456, demo/Demo@123456',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
