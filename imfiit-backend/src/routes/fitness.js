app.get('/api/challenge-code/:userId', (req, res) => {
  const { userId } = req.params;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const challengeCode = `${userId.slice(-4)}-${timestamp.toString(36)}-${random}`.toUpperCase();
  
  // Store with TTL (10 minutes)
  challengeCodes[userId] = {
    code: challengeCode,
    expires: timestamp + (10 * 60 * 1000)
  };
  
  res.json({ challengeCode, expiresIn: 10 * 60 * 1000 });
});

app.post('/api/verify-challenge/:userId', (req, res) => {
  const { userId } = req.params;
  const { code } = req.body;
  
  const stored = challengeCodes[userId];
  if (!stored || stored.expires < Date.now()) {
    return res.status(400).json({ valid: false, reason: 'Expired or not found' });
  }
  
  if (stored.code !== code) {
    return res.status(400).json({ valid: false, reason: 'Invalid code' });
  }
  
  // Clean up used code
  delete challengeCodes[userId];
  res.json({ valid: true });
});