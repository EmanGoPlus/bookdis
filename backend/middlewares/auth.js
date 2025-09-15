
import jwt from 'jsonwebtoken';

const authenticateToken = (req, reply, done) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    

    console.log("🔍 JWT Payload:", payload);
    
    req.user = { 
      id: payload.id || payload.userId, 
      role: payload.role,
      businessId: payload.businessId,
    };
    
    console.log("Setting req.user:", req.user);
    
    done();
  } catch (err) {
    console.error("❌ JWT verification error:", err);
    return reply.status(401).send({ error: 'Invalid token' });
  }
};

export default authenticateToken;