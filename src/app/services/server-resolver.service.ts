import { Injectable } from '@angular/core';
import {
  Resolve, RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers/app.states';
import { WebsocketService } from './websocket.service';
import ChatServer from '../../../shared-interfaces/server.interface';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/filter';
import { SET_CURRENT_SERVER } from '../reducers/current-server.reducer';
import { LEAVE_CHANNEL } from '../reducers/current-chat-channel.reducer';

@Injectable()
export class ServerResolver implements Resolve<ChatServer> {

  constructor(
    private store: Store<AppState>,
    private wsService: WebsocketService,
  ) { }

  async resolve(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Promise<any> {
    const id = route.paramMap.get('id');

    const currentServerStore = this.store.select('currentServer');

    await this.joinServer(id);

    return {
      server: currentServerStore,
      channel: this.store.select('currentChatChannel'),
    };
  }

  async joinServer(id: string) {
    const currentServerStore = this.store.select('serverList');

    const serverList = await currentServerStore
      .filter(list => list.some(srv => srv._id === id))
      .timeout(10000)
      .take(1)
      .toPromise();

    const server = serverList.find(srv => srv._id === id);

    this.store.dispatch({
      type: LEAVE_CHANNEL,
      payload: null,
    });
    this.store.dispatch({
      type: SET_CURRENT_SERVER,
      payload: server,
    });

    this.wsService.socket.emit('join-server', id);
    return server;
  }

}


