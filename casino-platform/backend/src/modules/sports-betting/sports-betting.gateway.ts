import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SportsBettingGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('WebSocket de Apuestas Deportivas Inicializado');
    // Simular actualizaciones de cuotas
    setInterval(() => {
      this.server.emit('oddsUpdate', {
        eventId: 'simulated-id',
        newOdds: (Math.random() * 5 + 1).toFixed(2),
      });
    }, 5000);
  }
}
