import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
const socket = io('http://localhost:3000');
import Peer from 'simple-peer';

export default function Meeting() {
  const router = useRouter();
  const { meetingId } = router.query;
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState();
  const [isAudio, setIsAudio] = useState(true);
  const [isVideo, setIsVideo] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const userName = router.query.name;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      userVideo.current.srcObject = stream;
      socket.emit('join-room', meetingId, socket.id, userName);

      socket.on('user-connected', (userId, userName) => {
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({
          peerID: userId,
          peer,
          userName,
        });
        setPeers(peers => [...peers, peer]);
      });

      socket.on('user-disconnected', userId => {
        const peerObj = peersRef.current.find(p => p.peerID === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const peers = peersRef.current.filter(p => p.peerID !== userId);
        peersRef.current = peers;
        setPeers(peers.map(p => p.peer));
      });

      socket.on('user-joined', payload => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
          userName: payload.userName,
        });
        setPeers(peers => [...peers, peer]);
      });

      socket.on('receiving-returned-signal', payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socket.on('receive-message', message => {
        setMessages(messages => [...messages, message]);
      });

      socket.on('participants-update', participants => {
        console.log('Participants update received:', participants);
        setParticipants(participants);
      });
    });
  }, [meetingId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('sending-signal', { userToSignal, callerID, signal, userName });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('returning-signal', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleAudio = () => {
    stream.getAudioTracks()[0].enabled = !isAudio;
    setIsAudio(!isAudio);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !isVideo;
    setIsVideo(!isVideo);
  };

  const sendMessage = () => {
    if (message) {
      const messageData = { text: message, name: userName };
      socket.emit('send-message', messageData, meetingId);
      setMessages(messages => [...messages, messageData]);
      setMessage('');
    }
  };

  const leaveMeeting = () => {
    router.push('/');
  };

  return (
    <div>
      <h1>Meeting ID: {meetingId}</h1>
      <div>
        <button onClick={toggleAudio}>{isAudio ? 'Mute Audio' : 'Unmute Audio'}</button>
        <button onClick={toggleVideo}>{isVideo ? 'Stop Video' : 'Start Video'}</button>
      </div>
      <video ref={userVideo} autoPlay playsInline />
      {peers.map((peer, index) => (
        <Video key={index} peer={peer} userName={peersRef.current.find(p => p.peer === peer).userName} />
      ))}
      <div>
        <div>
          {messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.name}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h2>Participants</h2>
        <ul>
          {participants.map((participant, index) => (
            <li key={index}>{participant.userName}</li>
          ))}
        </ul>
      </div>
      <button onClick={leaveMeeting}>Leave Meeting</button>
    </div>
  );
}

const Video = ({ peer, userName }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div>
      <video ref={ref} autoPlay playsInline />
      <div>{userName}</div>
    </div>
  );
};
