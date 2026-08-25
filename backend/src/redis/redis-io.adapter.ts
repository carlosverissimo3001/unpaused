import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { ServerOptions } from 'socket.io';
import { RedisService } from './redis.service';

/**
 * Without this, `.to(room).emit()` only reaches sockets held by the emitting
 * process, so two players in one room see nothing of each other whenever more
 * than one instance is up — including the overlap of every rolling deploy.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  async connect(): Promise<void> {
    const client = this.app.get(RedisService).getClient();

    // Pub/sub puts a connection into subscriber mode, where it can run nothing
    // else — hence two duplicates rather than the shared client.
    const pubClient = client.duplicate();
    const subClient = client.duplicate();

    await Promise.all([pubClient.ping(), subClient.ping()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options) as {
      adapter: (a: unknown) => void;
    };
    server.adapter(this.adapterConstructor);
    return server;
  }
}
