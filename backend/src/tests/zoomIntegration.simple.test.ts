import 'dotenv/config';
import zoomService from '../services/zoomService';

/**
 * Simplified test script to verify Zoom API integration
 * Run this with: npm run test:zoom:simple
 *
 * IMPORTANT: Before running this test, ensure your Zoom Server-to-Server OAuth app
 * has the following scopes enabled:
 * - meeting:read:meeting
 * - meeting:write:meeting
 * - user:read:user
 * - user:read:user:admin
 *
 * To configure your Zoom app:
 * 1. Go to https://marketplace.zoom.us/develop/create
 * 2. Create a Server-to-Server OAuth app
 * 3. Add the required scopes in the "Scopes" section
 * 4. Get Account ID, Client ID, and Client Secret
 * 5. Add them to your .env file
 */

async function testZoomIntegration() {
  try {
    // Test 1: Get current user first
    console.log('1. Testing getCurrentUser()...');
    const currentUser = await zoomService.getCurrentUser();
    console.log('✅ Current user retrieved:', {
      id: currentUser.id,
      email: currentUser.email,
      name: `${currentUser.first_name} ${currentUser.last_name}`,
      type: currentUser.type,
    });

    // Test 2: Create an instant meeting with the actual user's email
    console.log('\n2. Testing createInstantMeeting()...');
    const testMeeting = await zoomService.createInstantMeeting(
      currentUser.email,
      'Test Meeting - Integration Test',
      'This is a test meeting created by the integration test'
    );
    console.log('✅ Instant meeting created:', {
      id: testMeeting.id,
      topic: testMeeting.topic,
      join_url: testMeeting.join_url,
      start_time: testMeeting.start_time,
    });

    // Test 3: Get meeting details
    console.log('\n3. Testing getMeeting()...');
    const meetingDetails = await zoomService.getMeeting(
      testMeeting.id.toString()
    );
    console.log('✅ Meeting details retrieved:', {
      id: meetingDetails.id,
      topic: meetingDetails.topic,
      status: meetingDetails.status,
      created_at: meetingDetails.created_at,
    });

    // Test 4: Update meeting
    console.log('\n4. Testing updateMeeting()...');
    await zoomService.updateMeeting(testMeeting.id.toString(), {
      topic: 'Updated Test Meeting',
      agenda: 'Updated agenda for test meeting',
    });
    console.log('✅ Meeting updated successfully');

    // Test 5: Delete meeting
    console.log('\n5. Testing deleteMeeting()...');
    await zoomService.deleteMeeting(testMeeting.id.toString());
    console.log('✅ Meeting deleted successfully');

    console.log(
      '\n🎉 All tests passed! Zoom integration is working correctly.'
    );
    console.log(
      '\nYour Zoom Server-to-Server OAuth app is properly configured.'
    );
    console.log(
      'You can now use the Zoom meeting functionality in your application.'
    );
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);

    if (
      error.message.includes('Invalid access token') ||
      error.message.includes('scopes')
    ) {
      console.log('\n📋 SETUP REQUIRED:');
      console.log(
        'Your Zoom Server-to-Server OAuth app needs the following scopes:'
      );
      console.log('• meeting:read:meeting');
      console.log('• meeting:write:meeting');
      console.log('• user:read:user');
      console.log('• user:read:user:admin');
      console.log('\nTo fix this:');
      console.log('1. Go to https://marketplace.zoom.us/develop/create');
      console.log('2. Open your existing Server-to-Server OAuth app');
      console.log('3. Go to the "Scopes" section');
      console.log('4. Add the required scopes listed above');
      console.log('5. Save the changes');
      console.log('6. Run this test again');
    }

    process.exit(1);
  }
}

// Run the test
testZoomIntegration();
