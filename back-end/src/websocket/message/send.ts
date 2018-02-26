import ChatMessageModel from '../../models/chatmessage.model';
import Channel from '../../models/channel.model';
import { SendMessageRequest, ChatMessage } from 'shared-interfaces/message.interface';
import User from '../../models/user.model';
import Server from '../../models/server.model';
import * as config from 'config';
import canJoinServer from '../auth/can-join-server';
const TEST_SECRET = config.get('TEST_SOCKET_SECRET');

export function sendMessage(io: any) {
  io.on('connection', (socket) => {
    socket.on('send-message', async (request: SendMessageRequest) => {
      if (request.message.length < 1 || request.message.length > 5000) {
        socket.emit('soft-error', 'Invalid message length');
        return;
      }

      console.log('message', request);

      // TEST SOCKET ONLY
      if (socket.handshake.query && socket.handshake.query.test === TEST_SECRET) {
        const [testUser, firstChannel, srv] = await getTestUserObjects(socket, request);
        await emitMessage(io, request.message, firstChannel, testUser, srv);

        return;
      }

      const [user, channel]: Array<any> = await Promise.all([
        User.findById(socket.claim.user_id).lean(),
        Channel.findById(request.channel_id).lean()
      ]);

      // FRIENDS SERVER (DM)
      if (channel.user_ids && channel.user_ids.length > 0) {
        if (!channel.user_ids.toString().includes(user._id.toString())) {
          socket.emit('soft-error', 'You are not allowed to send this message.');
          console.log('returning');
          return;
        }
        await emitMessage(io, request.message, channel, user, null);
        return;
      }

      // NORMAL SERVER
      const server = await Server.find({ _id: channel.sever_id }).lean();
      if (!server || !canJoinServer(user, channel.server_id)) {
        socket.emit('soft-error', 'You don\'t have permission to send this message.');
        return;
      }
      await emitMessage(io, request.message, channel, user, server);

      return;
    });
  });
}

async function emitMessage(io, message: string, channel, user, server?) {
  const now = new Date();
  const chatMessage: ChatMessage = {
    username: user.username,
    message: message,
    channel_id: channel._id,
    user_id: user._id,
    createdAt: now,
    updatedAt: now,
  };

  if (server) {
    io.in(`server-${server._id}`).emit('chat-message', chatMessage);
  } else {
    console.log('emitting to ', `dmchannel-${channel._id}`);
    io.in(`dmchannel-${channel._id}`).emit('chat-message', chatMessage);
  }

  await saveMessage(chatMessage);
}

async function saveMessage(message) {
  await ChatMessageModel.create(message);
}

async function getTestUserObjects(socket, request) {
  // TEST USERS ONLY
  const user: any = await User.findById(socket.claim.user_id).lean();
  const [server_id] = user.joinedServers;
  const server: any = await Server.findById(server_id).lean();
  const [channel]: any = await Channel.find({
    server_id: server_id
  }).lean();
  return [user, channel, server];
}
