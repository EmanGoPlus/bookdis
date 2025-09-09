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
    req.user = { id: payload.userId, role: payload.role };
    done();
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
};

export default authenticateToken;
