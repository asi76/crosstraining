import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Loader2, X, Send, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  isPendingUser?: boolean;
  pendingEmail?: string;
}

export const Login = ({ isPendingUser, pendingEmail }: LoginProps) => {
  const { signIn, loading } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleRequestAccess = () => {
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (requestEmail.trim() && requestMessage.trim()) {
      // Save pending request to Firestore BEFORE auth
      await signIn(requestEmail, requestMessage);
      setShowRequestModal(false);
      setRequestEmail('');
      setRequestMessage('');
    }
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setRequestEmail('');
    setRequestMessage('');
  };

  const handleContactAdmin = () => {
    if (pendingEmail) {
      setRequestEmail(pendingEmail);
    }
    setShowRequestModal(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-zinc-900 backdrop-blur-sm rounded-b-xl border-b-2 border-black/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Crosstraining</h1>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="bg-primary/20 p-4 rounded-full mb-4"
            >
              <Dumbbell className="w-12 h-12 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Crosstraining</h1>
            <p className="text-gray-400 text-center">Sign in to access your workouts</p>
          </div>

          {isPendingUser ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
            >
              <p className="text-yellow-500 text-center text-sm">
                Your account is not yet enabled.
              </p>
              <p className="text-gray-400 text-center text-sm mt-2">
                Contact the administrator to request access.
              </p>
              <button
                onClick={handleContactAdmin}
                className="w-full mt-4 bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-500/30 transition-colors"
              >
                <Send className="w-4 h-4" />
                Contact Administrator
              </button>
            </motion.div>
          ) : null}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <button
            onClick={handleRequestAccess}
            className="w-full mt-4 bg-dark-hover border border-dark-border text-gray-300 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-dark-border transition-colors"
          >
            <Send className="w-4 h-4" />
            Request Access
          </button>

          <p className="text-gray-500 text-xs text-center mt-6">
            Only approved Google accounts can access this app
          </p>
        </div>
      </motion.div>

      {/* Request Access Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Request Access
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-dark-border rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-gray-400 mb-4">
                Write a message to the administrator explaining why you should have access to the Crosstraining app.
              </p>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Your Google Email</label>
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-dark-hover border border-dark-border rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi, I would like to request access to the Crosstraining app because..."
                className="w-full bg-dark-hover border border-dark-border rounded-lg p-4 text-white placeholder-gray-500 resize-none h-32 mb-4 focus:outline-none focus:border-blue-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-dark-hover border border-dark-border text-gray-300 rounded-lg font-medium hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!requestEmail.trim() || !requestMessage.trim() || loading}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
