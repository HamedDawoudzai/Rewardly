// backend/prisma/create-cashier.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const [utorid, email, password] = process.argv.slice(2);

  if (!utorid || !email || !password) {
    console.error("Usage: node create-cashier.js <utorid> <email> <password>");
    process.exit(1);
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log(`Creating cashier user: ${utorid} (${email})`);

  // Create user
  const user = await prisma.user.create({
    data: {
      username: utorid,
      email: email,
      name: utorid,               // default name same as utorid
      passwordHash,
      isActivated: true,          // cashiers should be active
      isStudentVerified: true,    // optional
      account: {
        create: {
          pointsCached: 0
        }
      }
    }
  });

  // Look up the "cashier" role
  const cashierRole = await prisma.role.findUnique({
    where: { name: "cashier" }
  });

  if (!cashierRole) {
    console.error("❌ Role 'cashier' does not exist in the database!");
    process.exit(1);
  }

  // Attach role to user
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: cashierRole.id
    }
  });

  console.log(`✅ Cashier user created successfully!`);
  console.log(`ID: ${user.id}`);
  console.log(`UTORid: ${user.username}`);
  console.log(`Email: ${user.email}`);
}

main()
  .catch(err => {
    console.error("❌ Error creating cashier user:", err);
  })
  .finally(() => prisma.$disconnect());

