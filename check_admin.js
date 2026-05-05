const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

p.user.findFirst({
  where: { mobile: '09000000001' },
  select: { userCode: true, status: true, loginAttempts: true, lockedUntil: true, passwordHash: true, adminProfile: true }
}).then(u => {
  if (!u) { console.log('USER NOT FOUND for mobile 09000000001'); return; }
  bcrypt.compare('admin@12321#', u.passwordHash).then(ok => {
    console.log(JSON.stringify({
      userCode: u.userCode,
      status: u.status,
      loginAttempts: u.loginAttempts,
      lockedUntil: u.lockedUntil,
      passwordMatch: ok,
      hasAdminProfile: !!u.adminProfile,
      adminRole: u.adminProfile?.adminRole ?? null
    }, null, 2));
  });
}).catch(e => console.error(e.message)).finally(() => p.$disconnect());
