import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pravaah_jwt_secret_key_prod_8ad5bf8c';

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query user from SQL Server dbo.Users
    let user = await dbService.authenticateUser(username);

    if (!user) {
      // Fallback for dynamically logging in as visitor or operator in demo
      const assignedRole = role === 'OPERATOR' ? 'OPERATOR' : 'VISITOR';
      user = {
        userId: `usr-${Date.now()}`,
        username,
        fullName: username.charAt(0).toUpperCase() + username.slice(1),
        role: assignedRole,
        email: `${username}@pravaah.app`
      };
    }

    if (role && (role === 'OPERATOR' || role === 'VISITOR')) {
      user.role = role;
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

export default router;
