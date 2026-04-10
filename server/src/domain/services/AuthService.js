import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  /**
   * Compare candidate password with hashed password
   * @param {string} candidatePassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  static async validatePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Generate JWT Token
   * @param {string} userId
   * @param {string} role
   * @param {string} businessId
   * @returns {string} token
   */
  static generateToken(userId, role, businessId) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign({ id: userId, role, businessId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
  }

  /**
   * Generate refresh token
   * @param {string} userId
   * @param {string} role
   * @param {string|null} businessId
   * @returns {string}
   */
  static generateRefreshToken(userId, role, businessId = null) {
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
      { id: userId, role, businessId, type: "refresh" },
      refreshSecret,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || "60d",
      },
    );
  }

  /**
   * Verify refresh token and return decoded payload
   * @param {string} token
   * @returns {object}
   */
  static verifyRefreshToken(token) {
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    return jwt.verify(token, refreshSecret);
  }

  /**
   * Resolve token expiration date in ISO format
   * @param {string} token
   * @returns {string|null}
   */
  static getTokenExpirationIso(token) {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== "object" || !decoded.exp) {
      return null;
    }

    return new Date(Number(decoded.exp) * 1000).toISOString();
  }

  /**
   * Hash password
   * @param {string} password
   * @returns {Promise<string>}
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}
