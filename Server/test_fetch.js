const fetch = require('node-fetch');

async function testFetch() {
  try {
    const res = await fetch('http://localhost:5000/'); 

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON response:", text);
      return;
    }

    if (!res.ok) {
      console.error("Server error:", text);
      return;
    }

    console.log('Server status:', data);

  } catch (err) {
    console.error('Fetch failed from script:', err.message);
  }
}

testFetch();