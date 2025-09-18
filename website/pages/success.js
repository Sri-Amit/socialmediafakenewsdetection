import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const { session_id } = router.query;
    
    if (session_id) {
      // Verify the session and update subscription
      verifySession(session_id);
    }
  }, [router.query]);

  const verifySession = async (sessionId) => {
    try {
      const response = await fetch('/api/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        setLoading(false);
        // Redirect to extension after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        setError('Failed to verify payment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setError('An error occurred while verifying your payment');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Verifying your payment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your Pro subscription has been activated. You now have unlimited fact checks!
        </p>
        <p className="text-sm text-gray-500">
          This window will close automatically in a few seconds...
        </p>
      </div>
    </div>
  );
}
