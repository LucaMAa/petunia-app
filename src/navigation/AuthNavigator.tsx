import React, { useState } from 'react';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

type AuthRoute = 'login' | 'register' | 'forgot';

export function AuthNavigator() {
  const [route, setRoute] = useState<AuthRoute>('login');

  if (route === 'register')
    return (
      <RegisterScreen
        onNavigateLogin={() => setRoute('login')}
        onSuccess={() => setRoute('login')}
      />
    );

  if (route === 'forgot')
    return <ForgotPasswordScreen onBack={() => setRoute('login')} />;

  return (
    <LoginScreen
      onNavigateRegister={() => setRoute('register')}
      onNavigateForgot={() => setRoute('forgot')}
    />
  );
}
