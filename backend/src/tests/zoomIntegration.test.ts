import 'dotenv/config';
import zoomService from '../services/zoomService';

/**
 * Test script to verify Zoom API integration
 * Run this with: npm run test:zoom
 */

async function testZoomIntegration() {
  console.log('🔍 Testing Zoom API Integration...\n');

  try {
    // Test 1: Get current user
    console.log('1. Testing getCurrentUser()...');
    const currentUser = await zoomService.getCurrentUser();
    console.log('✅ Current user:', {
      id: currentUser.id,
      email: currentUser.email,
      name: `${currentUser.first_name} ${currentUser.last_name}`,
      type: currentUser.type,
    });
    console.log('');

    // Test 2: Create instant meeting
    console.log('2. Testing createInstantMeeting()...');
    const instantMeeting = await zoomService.createInstantMeeting(
      currentUser.email,
      'Test Instant Meeting',
      'This is a test meeting created via API'
    );
    console.log('✅ Instant meeting created:', {
      id: instantMeeting.id,
      topic: instantMeeting.topic,
      join_url: instantMeeting.join_url,
      start_url: instantMeeting.start_url,
      password: instantMeeting.password,
    });
    console.log('');

    // Test 3: Create scheduled meeting
    console.log('3. Testing createScheduledMeeting()...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

    const scheduledMeeting = await zoomService.createScheduledMeeting(
      currentUser.email,
      'Test Scheduled Meeting',
      tomorrow.toISOString(),
      60,
      'UTC',
      'This is a test scheduled meeting',
      ['test@example.com']
    );
    console.log('✅ Scheduled meeting created:', {
      id: scheduledMeeting.id,
      topic: scheduledMeeting.topic,
      start_time: scheduledMeeting.start_time,
      join_url: scheduledMeeting.join_url,
      duration: scheduledMeeting.duration,
    });
    console.log('');

    // Test 4: Get meeting details
    console.log('4. Testing getMeeting()...');
    const meetingDetails = await zoomService.getMeeting(
      scheduledMeeting.id.toString()
    );
    console.log('✅ Meeting details retrieved:', {
      id: meetingDetails.id,
      topic: meetingDetails.topic,
      status: meetingDetails.status,
      created_at: meetingDetails.created_at,
    });
    console.log('');

    // Test 5: List meetings
    console.log('5. Testing listMeetings()...');
    const meetings = await zoomService.listMeetings(
      currentUser.id,
      'scheduled',
      5
    );
    console.log('✅ Meetings listed:', {
      total_records: meetings.total_records,
      meetings_count: meetings.meetings.length,
      meetings: meetings.meetings.map((m) => ({
        id: m.id,
        topic: m.topic,
        start_time: m.start_time,
        status: m.status,
      })),
    });
    console.log('');

    // Test 6: Update meeting
    console.log('6. Testing updateMeeting()...');
    await zoomService.updateMeeting(scheduledMeeting.id.toString(), {
      topic: 'Updated Test Meeting',
      agenda: 'Updated agenda for test meeting',
    });
    console.log('✅ Meeting updated successfully');
    console.log('');

    // Test 7: Delete meeting
    console.log('7. Testing deleteMeeting()...');
    await zoomService.deleteMeeting(scheduledMeeting.id.toString());
    console.log('✅ Meeting deleted successfully');
    console.log('');

    // Test 8: Delete instant meeting
    console.log('8. Cleaning up instant meeting...');
    await zoomService.deleteMeeting(instantMeeting.id.toString());
    console.log('✅ Instant meeting cleaned up');
    console.log('');

    console.log(
      '🎉 All tests passed! Zoom API integration is working correctly.'
    );
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error.response?.data || error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testZoomIntegration().catch(console.error);
}

export default testZoomIntegration;
