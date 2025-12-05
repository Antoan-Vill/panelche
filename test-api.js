// Test script to call CloudCart API directly
const fs = require('fs');

async function testAPI() {
  const SITE_URL = process.env.SITE_URL;
  const CLOUDCART_API_KEY = process.env.CLOUDCART_API_KEY;

  if (!SITE_URL || !CLOUDCART_API_KEY) {
    console.error('Missing environment variables');
    return;
  }

  const categoryId = '42'; // This is the category ID from the sample response
  const params = new URLSearchParams({
    'filter[category_id]': categoryId,
    'include': 'images',
    'page[size]': '100',
    'page[number]': '1',
    'sort': 'sort_order',
    'direction': 'asc',
  });

  const url = `${SITE_URL}/api/v2/products?${params.toString()}`;

  console.log('Calling URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'X-CloudCart-ApiKey': CLOUDCART_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response structure:');
    console.log('- Has data:', 'data' in data);
    console.log('- Has meta:', 'meta' in data);
    console.log('- Has links:', 'links' in data);
    console.log('- Has included:', 'included' in data);
    console.log('- Data type:', typeof data.data);
    console.log('- Data length:', Array.isArray(data.data) ? data.data.length : 'not array');

    if (data.data && data.data[0]) {
      console.log('- First product keys:', Object.keys(data.data[0]));
      console.log('- First product attributes keys:', Object.keys(data.data[0].attributes || {}));
    }

    // Save the response for debugging
    const fs = require('fs');
    fs.writeFileSync('live-response.json', JSON.stringify(data, null, 2));
    console.log('Saved live response to live-response.json');

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
