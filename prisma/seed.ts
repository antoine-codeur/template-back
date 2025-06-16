import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  // Create users
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'user@example.com',
      password: hashedPassword,
      name: 'John Doe',
      bio: 'Regular user for testing',
      role: 'USER',
      status: 'ACTIVE',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      bio: 'System administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'superadmin@example.com',
      password: hashedAdminPassword,
      name: 'Super Admin',
      bio: 'Super administrator with full access',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'suspended@example.com',
      password: hashedPassword,
      name: 'Suspended User',
      bio: 'This user is suspended',
      role: 'USER',
      status: 'SUSPENDED',
    },
  ];

  console.log('👤 Creating users...');
  
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Accounts:');
  console.log('👤 Regular User: user@example.com / password123');
  console.log('🔧 Admin: admin@example.com / admin123');
  console.log('⚡ Super Admin: superadmin@example.com / admin123');
  console.log('🚫 Suspended User: suspended@example.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
