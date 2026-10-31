import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserDoc, BusinessDoc, BusinessMembershipDoc } from '../db/store.js';
import { AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, phone, password, businessName, businessType, address, city, state, pincode, gstin } = req.body;

    if (!name || !email || !phone || !password || !businessName) {
      return sendError(res, 'Name, email, phone, password, and business name are required', 400);
    }

    const data = db.getData();

    const existingUser = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return sendError(res, 'An account with this email already exists. Please log in.', 409);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Generate invoice prefix from business name initials or default
    const words = businessName.trim().split(/\s+/);
    const prefix = words.length >= 2 
      ? (words[0][0] + words[1][0] + (words[2]?.[0] || 'X')).toUpperCase()
      : businessName.substring(0, 3).toUpperCase();

    const newUser: UserDoc = {
      id: userId,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'USER',
      isEmailVerified: true,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const newBusiness: BusinessDoc = {
      id: businessId,
      name: businessName,
      businessType: businessType || 'General Retail & Services',
      email: email.toLowerCase(),
      phone,
      address: address || '',
      city: city || '',
      state: state || 'Rajasthan',
      pincode: pincode || '',
      gstin: gstin || undefined,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      invoicePrefix: prefix,
      invoiceNextNumber: 101,
      status: 'ACTIVE',
      taxRatePercent: 18,
      taxEnabled: true,
      createdAt: now,
      updatedAt: now,
    };

    const newMembership: BusinessMembershipDoc = {
      id: membershipId,
      userId,
      businessId,
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: now,
    };

    // Default categories for new business
    const defaultCat1 = { id: `cat_${Date.now()}_1`, businessId, name: 'General Goods', description: 'Standard products and fast-moving items', isArchived: false, createdAt: now };
    const defaultCat2 = { id: `cat_${Date.now()}_2`, businessId, name: 'Services & Labor', description: 'Fitting, installation, and labor charges', isArchived: false, createdAt: now };

    data.users.push(newUser);
    data.businesses.push(newBusiness);
    data.memberships.push(newMembership);
    data.categories.push(defaultCat1, defaultCat2);

    data.auditLogs.push({
      id: `log_${Date.now()}`,
      businessId,
      userId,
      userName: name,
      action: 'REGISTER_BUSINESS',
      entityType: 'BUSINESS',
      entityId: businessId,
      details: { businessName, email },
      createdAt: now,
    });

    db.save();

    const token = jwt.sign({ userId, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        },
        business: newBusiness,
        membership: newMembership,
      },
      'Welcome to BizSathi! Your business account is set up and ready to use.',
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || 'Error occurred during registration', 500);
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const data = db.getData();
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Account is suspended. Please contact platform administrator.', 403);
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch user memberships and businesses
    const memberships = data.memberships.filter((m) => m.userId === user.id && m.status === 'ACTIVE');
    const userBusinesses = memberships.map((m) => {
      const b = data.businesses.find((biz) => biz.id === m.businessId);
      return {
        ...b,
        userRole: m.role,
      };
    }).filter(Boolean);

    // Default to first active business
    const activeBusiness = userBusinesses[0] || null;

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        business: activeBusiness,
        businesses: userBusinesses,
      },
      'Logged in successfully'
    );
  } catch (err: any) {
    return sendError(res, err.message || 'Login failed', 500);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const data = db.getData();

    const memberships = data.memberships.filter((m) => m.userId === user.id && m.status === 'ACTIVE');
    const businesses = memberships.map((m) => {
      const b = data.businesses.find((biz) => biz.id === m.businessId);
      return {
        ...b,
        userRole: m.role,
      };
    }).filter(Boolean);

    // Active business based on request header or first
    const activeBizId = (req.headers['x-business-id'] as string) || (businesses[0]?.id as string);
    const activeBusiness = businesses.find((b: any) => b.id === activeBizId) || businesses[0] || null;

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      business: activeBusiness,
      businesses,
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to get profile', 500);
  }
}
