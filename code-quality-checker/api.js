const express = require('express');
const { run } = require('./index'); // We'll use the run function from index.js for now

const app = express();
app.use(express.json());

app.post('/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }
  try {
    // We'll need to refactor run to return the summary instead of printing it
    const summary = await run(repoUrl, true); // Pass a flag to return summary
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
}); 