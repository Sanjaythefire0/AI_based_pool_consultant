const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const { analyzeCodeQuality } = require('./parser');

const EXTENSIONS = ['.js', '.py', '.java', '.cpp']; // You can customize this

/**
 * Clones a GitHub repo into a local directory.
 */
async function cloneRepo(repoUrl, localDir = './repo-temp') {
  if (fs.existsSync(localDir)) {
    console.log('Cleaning old repo...');
    await fs.remove(localDir);
  }

  const git = simpleGit();
  console.log('Cloning repo...');
  await git.clone(repoUrl, localDir);
  return localDir;
}

/**
 * Recursively gets code files from a directory.
 */
async function getCodeFiles(dirPath, exts = EXTENSIONS, fileList = []) {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await getCodeFiles(fullPath, exts, fileList);
    } else if (exts.includes(path.extname(file))) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Reads file content safely.
 */
async function readFileContent(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

function extractScoreAndImprovements(rawText) {
  // Try to extract a score and 2-3 lines of improvements from the Gemini response
  let score = null;
  let improvements = [];
  const scoreMatch = rawText.match(/score\s*[:\-]?\s*(\d{1,3})/i);
  if (scoreMatch) {
    score = scoreMatch[1];
  }
  // Try to extract improvements as bullet points or numbered list
  const improvementsMatch = rawText.match(/improvement[s]?[:\-]?([\s\S]*)/i);
  if (improvementsMatch) {
    // Split by lines, filter out empty, take first 3
    improvements = improvementsMatch[1].split(/\n|\r/).map(l => l.trim()).filter(Boolean).slice(0, 3);
  } else {
    // Fallback: take first 3 non-empty lines after the score
    const lines = rawText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    improvements = lines.slice(1, 4);
  }
  return { score, improvements };
}

/**
 * Main runner
 */
async function run(repoUrl, returnSummary = false) {
  try {
    const repoDir = await cloneRepo(repoUrl);
    const codeFiles = await getCodeFiles(repoDir);

    console.log(`📁 Total files found: ${codeFiles.length}`);

    // Aggregate all code into one string
    let allCode = '';
    for (const file of codeFiles) {
      const content = await readFileContent(file);
      allCode += `\n// File: ${file}\n` + content + '\n';
    }
    // Analyze the entire codebase at once
    const result = await analyzeCodeQuality(allCode);
    const { score, improvements } = extractScoreAndImprovements(result.raw);

    // Cleanup
    await fs.remove(repoDir);
    console.log('🧹 Repo folder deleted');

    if (returnSummary) {
      return { consolidatedScore: score, consolidatedImprovements: improvements };
    }
    // Print summary if not returning
    console.log('\n===== CONSOLIDATED CODE QUALITY SUMMARY =====');
    console.log(`Consolidated Score: ${score !== null ? score : 'N/A'}`);
    console.log('Improvements:');
    improvements.forEach((imp, idx) => console.log(`  ${idx + 1}. ${imp}`));
    console.log('===== END OF SUMMARY =====\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (returnSummary) {
      throw err;
    }
  }
}

module.exports = { run };

// Only run directly if not required as a module
if (require.main === module) {
  const githubRepoUrl = 'https://github.com/Sanjaythefire0/raspberry--pi'; // public repo
  (async () => {
    await run(githubRepoUrl);
  })();
}
