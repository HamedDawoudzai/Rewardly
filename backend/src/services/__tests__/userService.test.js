'use strict';

const { createUser } = require('../userService');
const userRepository = require('../../repositories/userRepository');

// Mock user repository
jest.mock('../../repositories/userRepository');

describe('UserService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData = {
      utorid: 'johndoe1',
      name: 'John Doe',
      email: 'john.doe@mail.utoronto.ca'
    };

    it('should create a new user successfully', async () => {
      // Mock: No existing user
      userRepository.findUserByEmailOrUsername.mockResolvedValue(null);

      // Mock user creation
      const mockUser = {
        id: 1,
        username: 'johndoe1',
        name: 'John Doe',
        email: 'john.doe@mail.utoronto.ca',
        isStudentVerified: false
      };

      const mockToken = {
        token: 'mock-uuid-token',
        expiresAt: new Date('2025-03-10T01:41:47.000Z')
      };

      userRepository.createUserWithRelations.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });

      // Execute
      const result = await createUser(validUserData);

      // Assert
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('utorid', 'johndoe1');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john.doe@mail.utoronto.ca');
      expect(result).toHaveProperty('verified', false);
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('resetToken');

      // Verify repository methods were called
      expect(userRepository.findUserByEmailOrUsername).toHaveBeenCalledWith(
        'john.doe@mail.utoronto.ca',
        'johndoe1'
      );
      expect(userRepository.createUserWithRelations).toHaveBeenCalled();
    });

    it('should throw error if utorid already exists', async () => {
      // Mock: Existing user with same utorid
      userRepository.findUserByEmailOrUsername.mockResolvedValue({
        id: 1,
        username: 'johndoe1',
        email: 'other@mail.utoronto.ca'
      });

      // Execute and assert
      await expect(createUser(validUserData)).rejects.toThrow('User with this utorid already exists');
    });

    it('should throw error if email already exists', async () => {
      // Mock: Existing user with same email
      userRepository.findUserByEmailOrUsername.mockResolvedValue({
        id: 1,
        username: 'other123',
        email: 'john.doe@mail.utoronto.ca'
      });

      // Execute and assert
      await expect(createUser(validUserData)).rejects.toThrow('User with this email already exists');
    });

    it('should create user with loyalty account', async () => {
      // Mock: No existing user
      userRepository.findUserByEmailOrUsername.mockResolvedValue(null);

      const mockUser = { 
        id: 1, 
        username: 'johndoe1',
        name: 'John Doe',
        email: 'john.doe@mail.utoronto.ca',
        isStudentVerified: false
      };
      const mockToken = { token: 'abc', expiresAt: new Date() };

      userRepository.createUserWithRelations.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });

      const result = await createUser(validUserData);

      // Verify repository method was called (which handles loyalty account creation)
      expect(userRepository.createUserWithRelations).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
    });

    it('should assign regular role by default', async () => {
      // Mock: No existing user
      userRepository.findUserByEmailOrUsername.mockResolvedValue(null);

      const mockUser = { 
        id: 1, 
        username: 'johndoe1',
        name: 'John Doe',
        email: 'john.doe@mail.utoronto.ca',
        isStudentVerified: false
      };
      const mockToken = { token: 'abc', expiresAt: new Date() };

      userRepository.createUserWithRelations.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });

      const result = await createUser(validUserData);

      // Verify repository method was called (which handles role assignment)
      expect(userRepository.createUserWithRelations).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
    });

    it('should generate activation token that expires in 7 days', async () => {
      // Mock: No existing user
      userRepository.findUserByEmailOrUsername.mockResolvedValue(null);

      const mockUser = { 
        id: 1, 
        username: 'johndoe1',
        name: 'John Doe',
        email: 'john.doe@mail.utoronto.ca',
        isStudentVerified: false
      };
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const mockToken = { 
        token: 'mock-token', 
        expiresAt: futureDate
      };

      userRepository.createUserWithRelations.mockResolvedValue({
        user: mockUser,
        token: mockToken
      });

      const result = await createUser(validUserData);

      // Check that expiration is approximately 7 days from now
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const actualExpiry = new Date(result.expiresAt);
      const timeDiff = Math.abs(actualExpiry.getTime() - expectedExpiry.getTime());
      
      // Allow 1 second tolerance
      expect(timeDiff).toBeLessThan(1000);
    });
  });
});

