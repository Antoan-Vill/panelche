// Direct test of the products service
const { cloudCartProducts } = require('./src/lib/services/cloudcart');

async function testDirect() {
  try {
    console.log('Testing direct products service call...');
    // Test with a category that might be failing
    const result = await cloudCartProducts.getByCategory('damski-vrahni-drehi', 1);
    console.log('✅ Success! Got', result.data.length, 'products');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirect();


