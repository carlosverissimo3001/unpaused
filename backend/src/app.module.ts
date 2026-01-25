import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { GameModule } from "./game/game.module";
import { SpotifyModule } from "./spotify/spotify.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PlaylistsModule,
    GameModule,
    SpotifyModule,
  ],
})
export class AppModule {}
