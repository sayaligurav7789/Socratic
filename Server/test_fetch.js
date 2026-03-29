const fetch = require('node-fetch');

async function testFetch() {
  try {
    const res = await fetch('http://localhost:5000/');
    const data = await res.json();
    console.log('Server status:', data);
  } catch (err) {
    console.error('Fetch failed from script:', err.message);
  }
}

testFetch();
