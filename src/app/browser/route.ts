import { NextResponse } from 'next/server';

export async function GET() {
  // Simplified route without file operations
  const fallbackCSS = `/* Default stylesheet for browser compatibility */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;
  
  return new NextResponse(fallbackCSS, {
    status: 200,
    headers: {
      'Content-Type': 'text/css',
    },
  });
}