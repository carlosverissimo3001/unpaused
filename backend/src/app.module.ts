import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "./logger/logger.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TransactionModule } from "./transaction/transaction.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { GameModule } from "./game/game.module";
import { SpotifyModule } from "./spotify/spotify.module";
import { MessageModule } from "./messages/message.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    TransactionModule,
    RedisModule,
    AuthModule,
    PlaylistsModule,
    GameModule,
    SpotifyModule,
    MessageModule,
    AdminModule,
  ],
})
export class AppModule { }
