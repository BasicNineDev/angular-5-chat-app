import { ChatChannel, ChannelList } from 'shared-interfaces/channel.interface';
import Channel from '../../models/channel.model';
import User from '../../models/user.model';
import { sendFriendsUserList } from '../friends/send-friends-list';

export function getDmChannels(io: any) {
  io.on('connection', socket => {
    socket.on('get-dm-channels', handler(io, socket));
  });
}

export function handler(io, socket) {
  return async () => {
    const user: any = await User
      .findById(socket.claim.user_id)
      .lean();
    if (!user) {
      socket.emit('soft-error', 'You are not logged in.');
      return;
    }
    await Promise.all([
      sendChannelList(user._id, socket),
      sendFriendsUserList(io, socket, user),
    ]);
  };
}

export async function sendChannelList(userId, socket) {
  let start = process.hrtime();
  const elapsed_time = function (note) {
    const precision = 3; // 3 decimal places
    const elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ' + note); // print message + time
    start = process.hrtime(); // reset the timer
  };

  const channels: any = await Channel
    .find({
      user_ids: userId
    },
    {
      name: 1,
      user_ids: 1,
    })
    .lean();

  elapsed_time('1 GOTCHANNELS');

  // Get all users in channels for their usernames etc.
  const usersObject = channels.reduce((acc, chan) => {
    chan.user_ids.forEach(id => acc[id] = null);
    return acc;
  }, {});

  const usersArray = Object.keys(usersObject);
  const users: any = await User.find(
    {
      _id: usersArray
    }, {
      username: 1
    })
    .lean();

  elapsed_time('1 GOTUSERS');

  users.forEach(user => {
    usersObject[user._id] = user;
  });

  const list = <ChannelList>{
    server_id: 'friends',
    channels: channels,
    users: usersObject
  };
  socket.emit('channel-list', list);
}
