const User = require('../models/User');

/**
 * Ensures a Government Administrator account exists upon server startup.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD environment variables with secure defaults.
 */
const seedAdminAccount = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jharkhand.gov.in').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Jharkhand2026';

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return;
    }

    // Check if the email is already taken by a non-admin
    const emailUser = await User.findOne({ email: adminEmail });
    if (emailUser) {
      emailUser.role = 'admin';
      emailUser.isVerified = true;
      emailUser.isEmailVerified = true;
      emailUser.verificationStatus = 'Verified';
      await emailUser.save();
      console.log(` Existing user [${adminEmail}] promoted to Government Administrator.`);
      return;
    }

    await User.create({
      name: 'Government of Jharkhand Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      organization: 'Department of Higher & Technical Education, Government of Jharkhand',
      phone: '+91 651 2446000',
      isEmailVerified: true,
      isVerified: true,
      verificationStatus: 'Verified',
      isActive: true,
    });

    // Ensure any existing university/industry users have valid verification status
    await User.updateMany(
      {
        role: { $in: ['university', 'industry'] },
        verificationStatus: { $exists: false },
      },
      {
        $set: {
          verificationStatus: 'Pending Verification',
          isVerified: false,
          isActive: true,
        },
      }
    );
  } catch (error) {
    console.error(' Admin seeding error:', error.message);
  }
};

module.exports = { seedAdminAccount };
