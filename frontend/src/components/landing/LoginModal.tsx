import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles, Shield, User, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle, loginWithDevTest, isLoading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMsg(null);
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        onSuccess();
      } else {
        throw new Error('No Google credentials returned.');
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMsg('Google login failed. You can also sign in with the instant Test Account below.');
    }
  };

  const handleDevTestLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithDevTest('Jayshankar Kumar', 'jayshankar@easeenglish.com');
      onSuccess();
    } catch (err: any) {
      console.error('Dev login failed:', err);
      setErrorMsg('Login failed. Please check backend connection.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign In to Ease English">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-white mb-2">
          Start Your English Practice
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Sign in with your Google account to save your conversation history, practice level, and personalized AI feedback.
        </p>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real Google OAuth Login Button */}
        <div className="flex justify-center mb-6 min-h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setErrorMsg('Google sign-in popup was cancelled or failed. You can use the Quick Test Account below.');
            }}
            useOneTap={false}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
          />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
              Or Quick Test
            </span>
          </div>
        </div>

        {/* Quick Test Login */}
        <Button
          variant="secondary"
          size="md"
          className="w-full text-slate-200"
          onClick={handleDevTestLogin}
          isLoading={isLoading}
          leftIcon={<User className="w-4 h-4 text-emerald-400" />}
        >
          Continue as Jayshankar Kumar (Test User)
        </Button>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Secure Google OAuth • Enterprise Identity Encrypted</span>
        </div>
      </div>
    </Modal>
  );
};
