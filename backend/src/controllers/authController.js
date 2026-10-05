const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { JWT_SECRET, GOOGLE_CLIENT_ID } = require('../config/env');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google OAuth ID token or access token
 * @access  Public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, token, isDevTest } = req.body;

    let email, name, avatar, googleId;

    // Developer Test Login mode for offline or quick verification
    if (isDevTest && process.env.NODE_ENV === 'development') {
      email = req.body.email || 'demo.learner@easeenglish.com';
      name = req.body.name || 'Demo Learner';
      avatar = req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
      googleId = 'dev_google_id_' + Date.now();
    } else if (credential) {
      // 1. Verify Google ID Token (from Google One Tap or standard @react-oauth/google)
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID || undefined
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'English Learner';
        avatar = payload.picture || '';
        googleId = payload.sub;
      } catch (err) {
        // Fallback to Google tokeninfo endpoint
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        email = response.data.email;
        name = response.data.name || 'English Learner';
        avatar = response.data.picture || '';
        googleId = response.data.sub;
      }
    } else if (token) {
      // 2. Verify Google OAuth Access Token
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      email = response.data.email;
      name = response.data.name || `${response.data.given_name || ''} ${response.data.family_name || ''}`.trim();
      avatar = response.data.picture || '';
      googleId = response.data.sub;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Google credential or token is required.'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Unable to retrieve verified email from Google.'
      });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update details if changed
      let hasChanges = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        hasChanges = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        hasChanges = true;
      }
      if (hasChanges) {
        await user.save();
      }
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        name: name || 'English Learner',
        avatar: avatar || '',
        googleId
      });
    }

    const authToken = generateToken(user._id);

    // Set secure cookie
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Google Auth Error]:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Google authentication failed. Please try again.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt
    }
  });
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log out user and clear auth cookie
 * @access  Public
 */
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
