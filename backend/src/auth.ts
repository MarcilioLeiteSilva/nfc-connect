import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nfc_connect_secret_comunicar_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
  status: 'ACTIVE' | 'INACTIVE';
  token_version: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: user.token_version
    },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 dias para conforto no celular sem deslogar
  );
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido ou inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      token_version: number;
    };

    // Consulta usuário no banco para checar status ativo e token_version (segurança contra roubo)
    const result = await pool.query(
      'SELECT id, name, email, role, status, token_version FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const dbUser = result.rows[0];

    if (dbUser.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Conta inativa. Acesso bloqueado.' });
      return;
    }

    if (dbUser.token_version !== decoded.token_version) {
      res.status(401).json({ error: 'Sessão encerrada pela administração. Faça login novamente.' });
      return;
    }

    req.user = dbUser;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token expirado ou inválido' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
