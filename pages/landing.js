import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Container, TextField, Typography } from '@mui/material';

export default function Landing() {
  const [meetingId, setMeetingId] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleCreateMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(2, 10);
    router.push(`/meeting/${newMeetingId}?name=${name}`);
  };

  const handleJoinMeeting = () => {
    if (meetingId) {
      router.push(`/meeting/${meetingId}?name=${name}`);
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h2" align="center" gutterBottom>
        K - Meet
      </Typography>
      <TextField
        label="Enter your name"
        variant="outlined"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Button variant="contained" color="primary" onClick={handleCreateMeeting} fullWidth style={{ marginBottom: '20px' }}>
        Create Meeting
      </Button>
      <TextField
        label="Enter Meeting ID"
        variant="outlined"
        fullWidth
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Button variant="contained" color="primary" onClick={handleJoinMeeting} fullWidth>
        Join Meeting
      </Button>
    </Container>
  );
}
