#!/bin/bash
# Local pre-flight compliance check script
echo "🔍 Starting portfolio pre-flight checks..."
if grep -q "^\.env" .gitignore; then
  echo "✅ Environment isolation check passed (.env is gitignored)."
else
  echo "❌ Error: .env file is not securely isolated inside your .gitignore file!"
  exit 1
fi
if [ -f "public/favicon.ico" ]; then
  echo "✅ Web identity asset verified (favicon present)."
else
  echo "❌ Error: Missing public/favicon.ico file target."
  exit 1
fi
echo "🚀 Project is compliant and ready for compilation!"
exit 0
