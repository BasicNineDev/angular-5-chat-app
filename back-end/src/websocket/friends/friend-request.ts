import User from '../../models/user.model';
import { FriendRequest } from 'shared-interfaces/user.interface';
import { log } from 'winston';

export function sendFriendRequest(io: any) {
  io.on('connection', socket => {
    socket.on('send-friend-request', async (userId: string) => {
      try {
        await handler(socket, userId);
      } catch (e) {
        log('error', 'sendFriendRequest', e);
      }
    });
  });
}

export async function handler(socket, userId: string) {
  const [fromUser, toUser] = await getUsers(socket, userId);
  await saveFriendRequests(fromUser, toUser);
  socket.emit('sent-friend-request', toUser._id);
}

async function getUsers(socket, userId: string) {
  const users: any = await User.find(
    {
      _id: [socket.claim.user_id, userId]
    },
    {
      username: 1,
      friend_requests: 1,
    });


  const fromUser = users.find(usr => usr._id.toString() === socket.claim.user_id);
  const toUser = users.find(usr => usr._id.toString() === userId);

  if (!fromUser) {
    socket.error('Invalid token');
    throw new Error('fromUser not found');
  }

  if (!toUser) {
    socket.emit('soft-error', 'User not found.');
    throw new Error(`User ${fromUser._id} not found`);
  }

  return [fromUser, toUser];
}

async function saveFriendRequests(fromUser, toUser) {
  const outgoingRequest: FriendRequest = {
    type: 'outgoing',
    user_id: toUser._id
  };
  const incomingRequest: FriendRequest = {
    type: 'incoming',
    user_id: fromUser._id
  };
  const promises = [];

  if (!fromUser.friend_requests.some(req => req.user_id.toString() === toUser._id.toString())) {
    fromUser.friend_requests.push(outgoingRequest);
    promises.push(fromUser.save());
  }

  if (!toUser.friend_requests.some(req => req.user_id.toString() === fromUser._id.toString())) {
    toUser.friend_requests.push(incomingRequest);
    promises.push(toUser.save());
  }

  await Promise.all(promises);
}
