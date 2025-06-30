const fs = require('fs');
const path = require('path');
const execa = require('execa');
const randomNameGenerator = require('moniker');

const GITHUB_BOT_EMAIL = 'tools+cibot@razorpay.com';
const GITHUB_BOT_USERNAME = 'rzpcibot';

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
    execa.commandSync('node scripts/generateIcons.mjs');

    // 3. Create branch
    const branchName = `automate-icons-${randomNameGenerator
      .generator([randomNameGenerator.verb, randomNameGenerator.noun])
      .choose()}`;
    
    execa.commandSync(`git checkout -b ${branchName}`);
    execa.commandSync(`git config user.email ${GITHUB_BOT_EMAIL}`);
    execa.commandSync(`git config user.name ${GITHUB_BOT_USERNAME}`);

    // 4. Commit all changes
    execa.commandSync('git status');
    execa.commandSync('git add -A');
    execa.commandSync(`git commit -m "feat(icons): add new icons"`, {
      env: { HUSKY_SKIP_HOOKS: 1 },
    });

    // 5. Raise a PR
    execa.commandSync(`git push origin ${branchName}`);
    execa.commandSync(
      `gh pr create --title "feat(icons): add new icons" --head ${branchName} --repo razorpay/blade --body "This PR was opened by the Icon Upload GitHub action. It updates icon component files based on new icon data from Figma."`,
    );
    
    console.log(`Successfully created PR for branch: ${branchName}`);
  } catch (error) {
    console.error('Error uploading icons:', error);
    process.exit(1);
  }
};

uploadIcons();