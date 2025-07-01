const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const randomNameGenerator = require('moniker');

const GITHUB_BOT_EMAIL = 'tools+cibot@razorpay.com';
const GITHUB_BOT_USERNAME = 'rzpcibot';

const runCommand = (command, options = {}) => {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    throw error;
  }
};

const uploadIcons = async () => {
  try {
    // 1. Check if icons.json has been updated
    const iconsPath = path.resolve(__dirname, './icons.json');
    if (!fs.existsSync(iconsPath)) {
      console.log('No icons.json found, skipping upload');
      return;
    }

    // 2. Generate icon components
    console.log('Generating icon components...');
    runCommand('node scripts/generateIcons.mjs');

    // 3. Check if there are any changes to commit
    const statusResult = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!statusResult.trim()) {
      console.log('No changes detected, skipping PR creation');
      return;
    }

    // 4. Create branch
    const branchName = `automate-icons-${randomNameGenerator
      .generator([randomNameGenerator.verb, randomNameGenerator.noun])
      .choose()}`;
    
    console.log(`Creating branch: ${branchName}`);
    runCommand(`git checkout -b ${branchName}`);
    runCommand(`git config user.email ${GITHUB_BOT_EMAIL}`);
    runCommand(`git config user.name ${GITHUB_BOT_USERNAME}`);

    // 5. Commit all changes
    console.log('Committing changes...');
    runCommand('git status');
    runCommand('git add -A');
    runCommand(`git commit -m "feat(icons): add new icons"`, {
      env: { ...process.env, HUSKY_SKIP_HOOKS: 1 },
    });

    // 6. Raise a PR
    console.log('Pushing branch and creating PR...');
    runCommand(`git push origin ${branchName}`);
    runCommand(
      `gh pr create --title "feat(icons): add new icons" --head ${branchName} --repo razorpay/blade --body "This PR was opened by the Icon Upload GitHub action. It updates icon component files based on new icon data from Figma."`
    );
    
    console.log(`✅ Successfully created PR for branch: ${branchName}`);
  } catch (error) {
    console.error('❌ Error uploading icons:', error);
    process.exit(1);
  }
};

uploadIcons();