// middlewares/auth.js
import jwt from 'jsonwebtoken';

const authenticateToken = (req, reply, done) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // DEBUG: Log the payload to see what's actually in the token
    console.log("🔍 JWT Payload:", payload);
    
    req.user = { 
      // FIX: Use either payload.id or payload.userId depending on how you create the token
      id: payload.id || payload.userId, 
      role: payload.role,
      businessId: payload.businessId,
      phone: payload.phone // Include phone if available
    };
    
    // DEBUG: Log what we're setting in req.user
    console.log("🔍 Setting req.user:", req.user);
    
    done();
  } catch (err) {
    console.error("❌ JWT verification error:", err);
    return reply.status(401).send({ error: 'Invalid token' });
  }
};

export default authenticateToken;