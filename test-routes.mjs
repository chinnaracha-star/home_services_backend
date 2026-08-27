// Quick script to test if promotion endpoints are working

const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3001';
  
  const endpoints = [
    { url: `${baseUrl}/api/promotions`, method: 'GET', name: 'Get Promotions (NEW)' },
    { url: `${baseUrl}/promotion`, method: 'GET', name: 'Get Promotion (OLD - should 404)' },
    { url: `${baseUrl}/api/provinces`, method: 'GET', name: 'Get Provinces (NEW)' },
    { url: `${baseUrl}/provinces`, method: 'GET', name: 'Get Provinces (OLD - should 404)' },
  ];

  console.log('🧪 Testing API Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`✅ ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${response.status} ${response.statusText}\n`);
      } else {
        console.log(`❌ ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${response.status} ${response.statusText}\n`);
      }
    } catch (error) {
      console.log(`⚠️  ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
};

// Run the tests
testEndpoints().catch(console.error);
