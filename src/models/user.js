// src/models/user.js
const bcrypt = require('bcrypt');

/**
 * User model
 * In a real application, this would be a database model
 * This is a simple in-memory model for demonstration purposes
 */
class User {
  /**
   * Users array (in-memory storage)
   * @private
   */
  static #users = [
    {
      id: 1,
      username: 'admin',
      // Default password: admin123 (hashed)
      passwordHash: '$2b$10$3euPcmQFCiblsZB8sKaYAOV9UHjxNR3LOzKpYXEyNWBHvhkuLX/3e',
      role: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      createdAt: new Date('2023-01-01')
    },
    {
      id: 2,
      username: 'staff',
      // Default password: staff123 (hashed)
      passwordHash: '$2b$10$LHnUGsVCNUGXDUFBv3JLyeLlxiS5/xR.9Jl15qN.aK6p/r0UMY.Iy',
      role: 'staff',
      name: 'Staff User',
      email: 'staff@example.com',
      createdAt: new Date('2023-01-02')
    }
  ];

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Object|null} User object or null if not found
   */
  static findById(id) {
    const user = this.#users.find(u => u.id === parseInt(id));
    
    if (!user) return null;
    
    // Return copy without passwordHash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User object or null if not found
   */
  static findByUsername(username) {
    return this.#users.find(u => u.username === username) || null;
  }

  /**
   * Authenticate user
   * @param {string} username - Username
   * @param {string} password - Plain text password
   * @returns {Object|null} User object without password if authenticated, null otherwise
   */
  static async authenticate(username, password) {
    const user = this.findByUsername(username);
    
    if (!user) return null;
    
    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) return null;
    
    // Return user without passwordHash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users
   * @returns {Array} Array of users without passwords
   */
  static getAll() {
    return this.#users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user without password
   */
  static async create(userData) {
    // Check if username already exists
    if (this.findByUsername(userData.username)) {
      throw new Error('Username already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // Create new user
    const newUser = {
      id: this.#users.length > 0 ? Math.max(...this.#users.map(u => u.id)) + 1 : 1,
      username: userData.username,
      passwordHash,
      role: userData.role || 'staff',
      name: userData.name || userData.username,
      email: userData.email || '',
      createdAt: new Date()
    };
    
    // Add to users array
    this.#users.push(newUser);
    
    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

module.exports = User;