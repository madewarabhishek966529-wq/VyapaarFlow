import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { CONFIG } from '../config/constants';
import { registerSchema, loginSchema, UserRole } from '@vyapaarflow/shared';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      
      const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(validated.password, salt);

      // Check if this is the very first registered user -> make them Super Admin
      const totalUsers = await User.countDocuments();
      const isSuperAdmin = totalUsers === 0;

      const newUser = await User.create({
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        mobile: validated.mobile,
        role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.OWNER,
        isSuperAdmin
      });

      const token = jwt.sign(
        {
          userId: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          isSuperAdmin: newUser.isSuperAdmin
        },
        CONFIG.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: CONFIG.JWT_EXPIRES_IN as any }
      );

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            role: newUser.role,
            isSuperAdmin: newUser.isSuperAdmin
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      
      const user = await User.findOne({ email: validated.email.toLowerCase() });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      // Find user's associated business if any
      let currentBusiness = null;
      if (user.currentBusinessId) {
        currentBusiness = await Business.findById(user.currentBusinessId);
      }
      if (!currentBusiness) {
        currentBusiness = await Business.findOne({ ownerId: user._id });
        if (currentBusiness) {
          user.currentBusinessId = currentBusiness._id as any;
          await user.save();
        }
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          businessId: currentBusiness?._id?.toString(),
          isSuperAdmin: user.isSuperAdmin
        },
        CONFIG.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: CONFIG.JWT_EXPIRES_IN as any }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            currentBusinessId: currentBusiness?._id
          },
          business: currentBusiness,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user profile and business
   */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const business = user.currentBusinessId
        ? await Business.findById(user.currentBusinessId)
        : await Business.findOne({ ownerId: user._id });

      res.json({
        success: true,
        data: {
          user,
          business
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
