import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  RefreshCw,
  Shield,
  Loader2,
  UserMinus,
  MessageSquare,
  Mail
} from 'lucide-react';
import { 
  getPendingUsers, 
  getEnabledUsers, 
  approveUser, 
  rejectUser, 
  removeUser 
} from '../firebase/auth';

interface PendingUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
  message?: string;
  photoURL?: string | null;
  requestedAt?: { toDate: () => Date } | null;
}

interface EnabledUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
  approvedAt?: { toDate: () => Date } | null;
}

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [enabledUsers, setEnabledUsers] = useState<EnabledUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [pending, enabled] = await Promise.all([
        getPendingUsers(),
        getEnabledUsers()
      ]);
      setPendingUsers(pending);
      setEnabledUsers(enabled);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (email: string) => {
    setActionLoading(email);
    try {
      await approveUser(email);
      await fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
    setActionLoading(null);
  };

  const handleReject = async (email: string) => {
    setActionLoading(email);
    try {
      await rejectUser(email);
      await fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
    setActionLoading(null);
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Rimuovere ${email}?`)) return;
    setActionLoading(email);
    try {
      await removeUser(email);
      await fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
    }
    setActionLoading(null);
  };

  const formatDate = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage user access</p>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="flex border-b border-dark-border">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-dark-hover text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Clock className="w-4 h-4" />
              Access Requests
              {pendingUsers.length > 0 && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-dark-hover text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Users className="w-4 h-4" />
              Approved Users
              <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {enabledUsers.length}
              </span>
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : activeTab === 'requests' ? (
              pendingUsers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="bg-dark-hover p-4 rounded-full inline-block mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-400">No pending requests</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-dark-hover border border-dark-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || user.id.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg">{user.name || 'Unknown'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <p className="text-gray-400 text-sm">{user.id}</p>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                              Requested: {formatDate(user.requestedAt)}
                            </p>
                            
                            {/* Message Section */}
                            {user.message && (
                              <div className="mt-3 bg-dark-bg rounded-lg p-3 border border-dark-border">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="font-medium">Message:</span>
                                </div>
                                <p className="text-gray-300 text-sm italic">"{user.message}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve Access"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject Request"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : enabledUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-400">No approved users yet</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {enabledUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-dark-hover border border-dark-border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || user.id.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">{user.id}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Approved: {formatDate(user.approvedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(user.id)}
                      disabled={actionLoading === user.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove User"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="mt-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>
    </div>
  );
};
