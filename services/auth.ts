
import { User, UserRole } from '../types';
import { DB } from './db';

export class AuthService {
  static async signup(email: string, pass: string, name: string, role: UserRole): Promise<User | null> {
    const existingUsers = await DB.getUsers();
    const existingUser = existingUsers.find(u => u.email === email);
    if (existingUser) {
      return null;
    }

    const user: User = {
      id: `${role.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      email,
      password: pass,
      name,
      role,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      createdAt: new Date().toISOString()
    };
    await DB.saveUser(user);
    this.setSession(user);
    return user;
  }

  static async login(email: string, pass: string): Promise<User | null> {
    const users = await DB.getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      // Fetch fresh user data from database to get latest favorites, etc.
      const freshUser = await DB.getUserById(user.id);
      if (freshUser) {
        this.setSession(freshUser);
        return freshUser;
      }
      this.setSession(user);
      return user;
    }
    return null;
  }

  static logout() {
    localStorage.removeItem('prolux_session');
  }

  static getCurrentUser(): User | null {
    const session = localStorage.getItem('prolux_session');
    return session ? JSON.parse(session) : null;
  }

  static updateSession(user: User) {
    const { password, ...safeUser } = user;
    localStorage.setItem('prolux_session', JSON.stringify(safeUser));
  }

  static requireAuth(role?: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (role && user.role !== role) return false;
    return true;
  }

  private static setSession(user: User) {
    const { password, ...safeUser } = user;
    localStorage.setItem('prolux_session', JSON.stringify(safeUser));
  }
}
