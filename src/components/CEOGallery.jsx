import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Mock data for when Supabase is not configured
const mockCEOs = [
  { id: '1', twitter_handle: 'CryptoWhale', application_number: 1247, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '2', twitter_handle: 'DeFiGuru', application_number: 1246, created_at: new Date(Date.now() - 3 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '3', twitter_handle: 'MoonShot', application_number: 1245, created_at: new Date(Date.now() - 4 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '4', twitter_handle: 'DiamondHands', application_number: 1244, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '5', twitter_handle: 'WhaleMaker', application_number: 1243, created_at: new Date(Date.now() - 6 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '6', twitter_handle: 'StackSats', application_number: 1242, created_at: new Date(Date.now() - 7 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '7', twitter_handle: 'CryptoKing', application_number: 1241, created_at: new Date(Date.now() - 8 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '8', twitter_handle: 'YieldFarmer', application_number: 1240, created_at: new Date(Date.now() - 9 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
  { id: '9', twitter_handle: 'AlphaMale', application_number: 1239, created_at: new Date(Date.now() - 10 * 3600000).toISOString(), tweet_verified: true, generated_image_url: null },
];

// Format relative time
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
};

// CEO Card component
const CEOCard = ({ ceo, index, onClick }) => {
  const [imageError, setImageError] = useState(false);

  const imageUrl = ceo.generated_image_url && !imageError
    ? ceo.generated_image_url
    : `https://unavatar.io/twitter/${ceo.twitter_handle}`;

  return (
    <div
      onClick={() => onClick(ceo)}
      style={{
        background: 'rgba(35, 60, 55, 0.6)',
        border: '1px solid rgba(93, 130, 120, 0.3)',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        animation: `fadeInUp 0.5s ease-out ${index * 0.05}s forwards`,
        opacity: 0
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.borderColor = '#D5E59B';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(213, 229, 155, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(93, 130, 120, 0.3)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Verified Badge */}
      {ceo.tweet_verified && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(74, 222, 128, 0.95)',
          color: '#0a0f0d',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
          zIndex: 2
        }}>
          <span>✓</span>
          <span>Verified</span>
        </div>
      )}

      {/* CEO Image */}
      <img
        src={imageUrl}
        alt={`@${ceo.twitter_handle}`}
        onError={() => setImageError(true)}
        style={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          background: '#1a2520',
          borderBottom: '1px solid rgba(93, 130, 120, 0.2)'
        }}
      />

      {/* CEO Info */}
      <div style={{ padding: '20px' }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#D5E59B',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          @{ceo.twitter_handle}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'rgba(247, 247, 232, 0.5)'
        }}>
          <span style={{
            color: 'rgba(213, 229, 155, 0.7)',
            fontWeight: '600'
          }}>
            #{ceo.application_number}
          </span>
          <span>{formatTimeAgo(ceo.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

// Detail Modal component
const DetailModal = ({ ceo, onClose }) => {
  const [imageError, setImageError] = useState(false);

  if (!ceo) return null;

  const imageUrl = ceo.generated_image_url && !imageError
    ? ceo.generated_image_url
    : `https://unavatar.io/twitter/${ceo.twitter_handle}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 15, 13, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        padding: '40px 20px',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#F7F7E8',
          fontSize: '28px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          zIndex: 1001
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'rotate(90deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'rotate(0deg)';
        }}
      >
        ×
      </button>

      {/* Detail Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '800px',
          width: '100%',
          background: 'rgba(35, 60, 55, 0.95)',
          border: '1px solid rgba(93, 130, 120, 0.5)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt={`@${ceo.twitter_handle}`}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            maxHeight: '500px',
            objectFit: 'cover',
            borderBottom: '1px solid rgba(93, 130, 120, 0.3)'
          }}
        />

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <h2 style={{
            fontFamily: "'Moderno Sans', 'Inter', sans-serif",
            fontSize: '32px',
            color: '#D5E59B',
            marginBottom: '12px',
            letterSpacing: '2px'
          }}>
            @{ceo.twitter_handle}
          </h2>

          <div style={{
            color: 'rgba(247, 247, 232, 0.6)',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span>Application #{ceo.application_number}</span>
            <span>•</span>
            <span>{formatTimeAgo(ceo.created_at)}</span>
            {ceo.tweet_verified && (
              <>
                <span>•</span>
                <span style={{ color: '#4ade80', fontWeight: '600' }}>
                  ✓ Tweet Verified
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={`https://x.com/${ceo.twitter_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: '#D5E59B',
                color: '#0a0f0d',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                fontSize: '15px',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#c5d58b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(213, 229, 155, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#D5E59B';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>View Profile</span>
              <span>→</span>
            </a>

            {ceo.tweet_url && (
              <a
                href={ceo.tweet_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: 'transparent',
                  border: '2px solid #D5E59B',
                  color: '#D5E59B',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  fontSize: '15px',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#D5E59B';
                  e.currentTarget.style.color = '#0a0f0d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#D5E59B';
                }}
              >
                <span>View Tweet</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CEOGallery component
const CEOGallery = () => {
  const [ceos, setCeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCEO, setSelectedCEO] = useState(null);
  const [stats, setStats] = useState({ total: 0, verified: 0, lastHour: 0 });

  const PAGE_SIZE = 9;

  // Fetch CEOs from database
  const fetchCEOs = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('applications')
          .select('id, twitter_handle, application_number, created_at, tweet_verified, generated_image_url, tweet_url')
          .eq('tweet_verified', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        if (data) {
          if (append) {
            setCeos(prev => [...prev, ...data]);
          } else {
            setCeos(data);
          }
          setHasMore(data.length === PAGE_SIZE);
        }
      } else {
        // Use mock data
        const mockData = mockCEOs.slice(offset, offset + PAGE_SIZE);
        if (append) {
          setCeos(prev => [...prev, ...mockData]);
        } else {
          setCeos(mockData);
        }
        setHasMore(offset + PAGE_SIZE < mockCEOs.length);
      }
    } catch (err) {
      console.error('Error fetching CEOs:', err);
      // Fallback to mock data
      const mockData = mockCEOs.slice(offset, offset + PAGE_SIZE);
      if (append) {
        setCeos(prev => [...prev, ...mockData]);
      } else {
        setCeos(mockData);
      }
      setHasMore(offset + PAGE_SIZE < mockCEOs.length);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.functions.invoke('get-stats');
        if (data && !error) {
          // Calculate last hour count
          const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('tweet_verified', true)
            .gte('created_at', oneHourAgo);

          setStats({
            total: data.total_applications || 0,
            verified: data.verified_applications || 0,
            lastHour: count || 0
          });
        }
      } else {
        // Mock stats
        setStats({ total: 1247, verified: 892, lastHour: 24 });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ total: 1247, verified: 892, lastHour: 24 });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCEOs();
    fetchStats();
  }, [fetchCEOs, fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCEOs();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCEOs, fetchStats]);

  // Load more handler
  const handleLoadMore = () => {
    fetchCEOs(ceos.length, true);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedCEO(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedCEO) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCEO]);

  return (
    <div style={{ marginBottom: '64px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '20px',
          fontSize: '11px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'rgba(74, 222, 128, 0.9)',
          marginBottom: '24px'
        }}>
          ✨ Hall of Fame
        </div>

        <h2 style={{
          fontFamily: "'Moderno Sans', 'Inter', sans-serif",
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '400',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '16px',
          color: '#F7F7E8',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          Meet the CEOs
        </h2>

        <p style={{
          fontSize: '16px',
          color: 'rgba(247, 247, 232, 0.7)',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          The finest trading firm leaders in Cash City. Join the ranks.
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(24px, 5vw, 48px)',
        marginBottom: '48px',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Moderno Sans', 'Inter', sans-serif",
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '400',
            color: '#D5E59B',
            marginBottom: '4px'
          }}>
            {stats.total.toLocaleString()}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(247, 247, 232, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Applications
          </div>
        </div>

        <div style={{
          width: '1px',
          height: '40px',
          background: 'rgba(93, 130, 120, 0.3)'
        }} className="stats-divider-gallery" />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Moderno Sans', 'Inter', sans-serif",
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '400',
            color: '#D5E59B',
            marginBottom: '4px'
          }}>
            {stats.verified.toLocaleString()}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(247, 247, 232, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Verified
          </div>
        </div>

        <div style={{
          width: '1px',
          height: '40px',
          background: 'rgba(93, 130, 120, 0.3)'
        }} className="stats-divider-gallery" />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Moderno Sans', 'Inter', sans-serif",
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '400',
            color: '#D5E59B',
            marginBottom: '4px'
          }}>
            {stats.lastHour}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(247, 247, 232, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Last Hour
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '64px 0',
          color: 'rgba(247, 247, 232, 0.5)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(213, 229, 155, 0.2)',
            borderTopColor: '#D5E59B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}

      {/* Gallery Grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {ceos.map((ceo, index) => (
            <CEOCard
              key={ceo.id}
              ceo={ceo}
              index={index}
              onClick={setSelectedCEO}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && ceos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          color: 'rgba(247, 247, 232, 0.5)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
          <p>No verified CEOs yet. Be the first!</p>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && ceos.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '18px 32px',
              background: 'transparent',
              border: '2px solid #D5E59B',
              borderRadius: '12px',
              color: '#D5E59B',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: loadingMore ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) {
                e.currentTarget.style.background = '#D5E59B';
                e.currentTarget.style.color = '#0a0f0d';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(213, 229, 155, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#D5E59B';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCEO && (
        <DetailModal
          ceo={selectedCEO}
          onClose={() => setSelectedCEO(null)}
        />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .stats-divider-gallery {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CEOGallery;
