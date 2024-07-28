import { UserProfile } from 'src/interfaces/profile.interface';

export const requestData = {
  missingParameters: {
    oldPassword: '',
    newPassword: '',
  },
  samePasswords: {
    oldPassword: 'password123',
    newPassword: 'password123',
  },
  incorrectPassword: {
    oldPassword: 'wrongpassword',
    newPassword: 'newpassword123',
  },
  validPasswordChange: {
    oldPassword: 'password123',
    newPassword: 'newpassword123',
  },
};

export const mockResponses = {
  missingParameters: { message: 'Missing parameters' },
  samePasswords: { message: 'New password cannot be equal to old password' },
  incorrectPassword: { message: 'Incorrect password' },
  queryError: { error: 'Exception occurred while updating password' },
  passwordUpdated: { message: 'Password updated' },
  disconnected: { message: 'Disconnected' },
};

export const mockUser: UserProfile = {
  email: 'test@example.com',
  password: 'password123',
};
