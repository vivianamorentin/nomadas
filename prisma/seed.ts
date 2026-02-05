import { PrismaClient } from '../src/database/schema';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user for testing
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        verifiedAt: new Date(),
      },
    });

    // Add user roles
    await prisma.userRoleRelation.create({
      data: {
        userId: admin.id,
        role: 'BUSINESS_OWNER',
      },
    });

    await prisma.userRoleRelation.create({
      data: {
        userId: admin.id,
        role: 'NOMAD_WORKER',
      },
    });

    // Record ToS acceptance
    await prisma.tosAcceptance.create({
      data: {
        userId: admin.id,
        version: '1.0',
        ipAddress: '127.0.0.1',
        userAgent: 'nomadas-seed/1.0',
      },
    });

    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin user already exists');
  }

  // Create test users
  const testUsers = [
    {
      email: 'business@example.com',
      password: 'Business123!',
      firstName: 'John',
      lastName: 'Business',
      role: 'BUSINESS_OWNER',
    },
    {
      email: 'worker@example.com',
      password: 'Worker123!',
      firstName: 'Jane',
      lastName: 'Worker',
      role: 'NOMAD_WORKER',
    },
  ];

  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          verifiedAt: new Date(),
        },
      });

      // Add user role
      await prisma.userRoleRelation.create({
        data: {
          userId: user.id,
          role: userData.role as any,
        },
      });

      // Record ToS acceptance
      await prisma.tosAcceptance.create({
        data: {
          userId: user.id,
          version: '1.0',
          ipAddress: '127.0.0.1',
          userAgent: 'nomadas-seed/1.0',
        },
      });

      console.log(`Test user created: ${userData.email} / ${userData.password}`);
    } else {
      console.log(`Test user already exists: ${userData.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });