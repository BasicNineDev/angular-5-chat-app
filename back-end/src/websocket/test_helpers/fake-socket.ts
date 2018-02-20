/* istanbul ignore next */
export default function createFakeSocketEvent(
  eventName: string,
  data: any,
  claim: any,
  complete: any,
  result: any
) {
  const socket = {
    handshake: { query: {} },
    claim,
    on: async (event: string, callback: any) => {
      await callback(data);
      try {
        await complete();
      } catch (e) {
        console.error(e);
      }
    },
    emit: result,
    join: async () => null,
    rooms: {
      'server-123': true
    },
    leave: async () => null,
  };

  const io = {
    on: (event: string, callback: any) => {
      callback(socket);
    },
    in: () => ({
      emit: result
    }),
    of: () => ({
      connected: {
      },
    }),
  };
  return { io, socket };
}
