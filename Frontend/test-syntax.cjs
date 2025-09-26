// Simple syntax check for OnboardedEmployees.jsx
const fs = require('fs');
const babel = require('@babel/parser');

try {
  const code = fs.readFileSync('src/components/OnboardedEmployees.jsx', 'utf8');
  const ast = babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('✅ Syntax is valid');
} catch (error) {
  console.error('❌ Syntax error:', error.message);
  console.error('Line:', error.loc?.line);
  console.error('Column:', error.loc?.column);
}